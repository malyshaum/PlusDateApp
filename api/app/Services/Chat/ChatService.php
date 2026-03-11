<?php

namespace App\Services\Chat;

use App\Dto\Chat\ChatDto;
use App\Dto\Chat\ChatFilterDto;
use App\Dto\Chat\ChatMessageDto;
use App\Dto\Chat\CreateChatDto;
use App\Dto\Chat\SendMessageDto;
use App\Dto\CursorCollectionDto;
use App\Enums\Core\FileTypeEnum;
use App\Enums\Telegram\BotNotificationTypeEnum;
use App\Events\Chat\ChatCreatedEvent;
use App\Events\Chat\MessageReadEvent;
use App\Events\Chat\MessageSentEvent;
use App\Jobs\Notification\UserBotNotification;
use App\Mapping\Chat\ChatMapping;
use App\Mapping\CursorCollectionMapping;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\User\UserFile;
use App\Services\Notification\NotificationService;
use AutoMapperPlus\AutoMapper;
use AutoMapperPlus\Exception\InvalidArgumentException;
use AutoMapperPlus\Exception\UnregisteredMappingException;
use Exception;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\Cursor;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

readonly class ChatService
{
    public function __construct(
        private AutoMapper $mapper
    ) {
    }

    /**
     * @throws UnregisteredMappingException
     */
    public function createChat(CreateChatDto $dto): ChatDto
    {
        DB::beginTransaction();
        try {
            $lockKey = crc32(implode('-', [min($dto->userId, $dto->otherUserId), max($dto->userId, $dto->otherUserId)]));

            DB::select('SELECT pg_advisory_xact_lock(?)', [$lockKey]);

            $existingChat = Chat::query()
                ->select('chats.*')
                ->join('chat_users', 'chats.id', '=', 'chat_users.chat_id')
                ->whereIn('chat_users.user_id', [$dto->userId, $dto->otherUserId])
                ->groupBy('chats.id')
                ->having(DB::raw('COUNT(DISTINCT chat_users.user_id)'), '=', 2)
                ->first();

            if ($existingChat) {
                DB::commit();
                $existingChat->load(['users', 'latestMessage.sender']);
                return $this->mapper->map($existingChat->toArray(), ChatDto::class);
            }

            $chat = Chat::query()->create();
            $chat->users()->attach([
                $dto->userId => ['joined_at' => now()],
                $dto->otherUserId => ['joined_at' => now()],
            ]);

            $chat->load(['users', 'latestMessage.sender']);
            $chatDto = $this->mapper->map($chat->toArray(), ChatDto::class);

            ChatCreatedEvent::dispatch($chatDto, $dto->userId, $dto->otherUserId);

            DB::commit();
            return $chatDto;
        } catch (Exception $exception) {
            DB::rollBack();
            throw $exception;
        }
    }

    /**
     * @throws UnregisteredMappingException
     */
    public function sendMessage(SendMessageDto $dto): ChatMessageDto
    {
        DB::beginTransaction();
        try {
            $message = ChatMessage::query()->create([
                'chat_id' => $dto->chatId,
                'sender_id' => $dto->senderId,
                'message' => $dto->message,
                'sent_at' => Carbon::now(),
            ]);

            $message->chat->touch();
            DB::commit();
        } catch (Exception $exception) {
            DB::rollBack();
            throw $exception;
        }

        /** @see ChatMapping::arrayToChatMessageDto() */
        $messageDto = $this->mapper->map($message->toArray(), ChatMessageDto::class);

        MessageSentEvent::broadcast($messageDto);

        $userId = DB::table('chat_users')
            ->where('chat_id', $dto->chatId)
            ->where('user_id','!=', $dto->senderId)
            ->first()
            ->user_id;

        UserBotNotification::dispatch($userId, BotNotificationTypeEnum::MESSAGES);

        return $messageDto;
    }

    /**
     * @throws InvalidArgumentException
     * @throws UnregisteredMappingException
     */
    public function getUserChats(ChatFilterDto $filterDto): CursorCollectionDto
    {
        $pagination = Chat::query()
            ->select('chats.*')
            ->join('chat_users', function($join) use ($filterDto) {
                $join->on('chats.id', '=', 'chat_users.chat_id')
                    ->where('chat_users.user_id', $filterDto->userId);
            })
            ->whereHas('users', function ($query) use ($filterDto) {
                $query->where('users.id', '!=', $filterDto->userId)
                      ->whereNull('deleted_at');
            })
            ->with([
                'users' => function ($query) {
                    $query->whereNull('deleted_at');
                },
                'users.files' => function ($query) {
                    $query->where('is_under_moderation', false)
                        ->where('is_main', true)
                        ->whereDoesntHave('moderation')
                        ->where('type', FileTypeEnum::IMAGE);
                },
                'latestMessage'
            ])
            ->withCount(['messages as unread_count' => function ($query) use ($filterDto) {
                $query->where('sender_id', '!=', $filterDto->userId)->whereNull('read_at');
            }])
            ->orderBy('updated_at', 'desc')
            ->cursorPaginate(perPage: 20, cursor: Cursor::fromEncoded($filterDto->cursor));

        /** @var CursorCollectionDto $collection */
        /** @see CursorCollectionMapping */
        return $this->mapper->map($pagination, CursorCollectionDto::class);
    }

    /**
     * @throws UnregisteredMappingException
     */
    public function getChatMessages(int $chatId, int $userId, string|null $cursor, int $perPage = 20): CursorCollectionDto
    {
        $manualPrevCursor = null;
        $query = ChatMessage::query()->where('chat_id', $chatId);

        $query->orderBy('id', 'asc');

        if ($cursor === null) {
            $firstUnread = ChatMessage::query()
                ->where('chat_id', $chatId)
                ->where('sender_id', '!=', $userId)
                ->whereNull('read_at')
                ->orderBy('id', 'asc')
                ->first();

            if ($firstUnread) {
                $perPage += 10;

                $contextMessage = ChatMessage::query()
                    ->where('chat_id', $chatId)
                    ->where('id', '<', $firstUnread->id)
                    ->orderBy('id', 'desc')
                    ->skip(9)
                    ->first();

                if ($contextMessage) {
                    $query->where('id', '>=', $contextMessage->id);
                    $manualPrevCursor = new Cursor(['id' => $contextMessage->id], false);
                }
            } else {
                $latestPageStart = ChatMessage::query()
                    ->where('chat_id', $chatId)
                    ->orderBy('id', 'desc')
                    ->take($perPage)
                    ->get()
                    ->last();

                if ($latestPageStart) {
                    $query->where('id', '>=', $latestPageStart->id);
                    $manualPrevCursor = new Cursor(['id' => $latestPageStart->id], false);
                }
            }

            $pagination = $query->cursorPaginate(perPage: $perPage);
        } else {
            $pagination = $query->cursorPaginate(perPage: $perPage, cursor: Cursor::fromEncoded($cursor));
        }

        /** @var CursorCollectionDto $dto */
        $paginationDto = $this->mapper->map($pagination, CursorCollectionDto::class);

        if ($manualPrevCursor !== null) {
            $paginationDto->prevCursor = $manualPrevCursor->encode();
        }

        return $paginationDto;
    }

    public function markMessagesRead(int $messageId, int $userId): bool
    {
        $message = ChatMessage::query()->find($messageId);

        ChatMessage::query()
            ->whereHas('chat.users', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->where('chat_id', $message->chat_id)
            ->where('sender_id', '!=', $userId)
            ->where('read_at', null)
            ->whereDate('created_at', '<=', $message->created_at)
            ->update(['read_at' => Carbon::now()]);

        MessageReadEvent::dispatch($message->id, $message->sender_id, $message->chat_id);

        return true;
    }

    public function userRecentChats(int $userId, string|null $cursor): CursorCollectionDto
    {
        $chats = Chat::query()
            ->select(['chats.id'])
            ->selectSub(
                ChatMessage::query()
                    ->select('message')
                    ->whereColumn('chat_id', 'chats.id')
                    ->latest()
                    ->limit(1),
                'last_message'
            )
            ->selectSub(
                UserFile::query()
                    ->select('filepath')
                    ->whereColumn('user_id', 'users.id')
                    ->where('is_main', true)
                    ->where('is_under_moderation', false)
                    ->where('type', FileTypeEnum::IMAGE)
                    ->latest()
                    ->limit(1),
                'filepath'
            )
            ->whereHas('users', function($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->join('chat_users', 'chats.id', '=', 'chat_users.chat_id')
            ->join('users', function($join) use ($userId) {
                $join->on('chat_users.user_id', '=', 'users.id')
                    ->where('users.id', '!=', $userId)
                    ->where('users.deleted_at', '=', null);
            })
            ->addSelect(['users.id as user_id', 'users.name as user_name'])
            ->orderBy('chats.created_at', 'desc')
            ->groupBy('chats.id', 'users.id', 'users.name')
            ->cursorPaginate(perPage: 20, cursor: Cursor::fromEncoded($cursor));

        /** @var CursorCollectionDto $dto */
        /** @see CursorCollectionMapping */
        $dto = $this->mapper->map($chats, CursorCollectionDto::class);

        $dto->data = $dto->data->map(function ($chat) use ($userId) {
            if ($chat->filepath) {
                $chat->url = Storage::temporaryUrl($chat->filepath, Carbon::now()->addDay());
            }
            return $chat;
        });

        return $dto;
    }

    /**
     * @throws UnregisteredMappingException
     */
    public function getChatsWithUnreadMessages(int $userId, string|null $cursor = null): CursorCollectionDto
    {
        $chats = Chat::query()
            ->whereHas('users', fn(Builder $query) => $query->where('users.id', $userId)->whereNull('deleted_at'))
            ->whereHas('messages', function (Builder $query) use ($userId) {
                $query->where('read_at', null)
                    ->where('sender_id', '!=', $userId)
                    ->latest()
                    ->limit(1);
            })
            ->cursorPaginate(perPage: 20, cursor: Cursor::fromEncoded($cursor));

        /** @see CursorCollectionMapping */
        return $this->mapper->map($chats, CursorCollectionDto::class);
    }
}
