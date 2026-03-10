<?php

namespace App\Repositories;

use App\Dto\User\UserDto;
use App\Models\User;
use AutoMapperPlus\AutoMapper;
use AutoMapperPlus\Exception\UnregisteredMappingException;

readonly class UserRepository
{
    public function __construct(
        private AutoMapper $mapper,
    )
    {

    }

    /**
     * @throws UnregisteredMappingException
     */
    public function getById(int $userId): UserDto|null
    {
        $user = User::query()->with('feedProfile')->find($userId);
        if ($user === null) {
            return null;
        }

        /** @see UserToUserDtoMapper::mapToObject() */
        return $this->mapper->map($user, UserDto::class);
    }
}
