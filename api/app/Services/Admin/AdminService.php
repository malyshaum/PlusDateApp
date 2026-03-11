<?php

namespace App\Services\Admin;

use App\Dto\User\DeleteAccountDto;
use App\Enums\User\DeletionReasonEnum;
use App\Services\User\AccountDeletionService;
use Exception;

readonly class AdminService
{
    public function __construct(
        private AccountDeletionService $deletionService,
    ) {
    }

    /**
     * @throws Exception
     */
    public function permanentlyDeleteAccount(array $data): void
    {
        $dto = new DeleteAccountDto();
        $dto->userId = $data['user_id'];
        $dto->reasons = array_map(
            fn($reason) => DeletionReasonEnum::from($reason),
            $data['reasons']
        );
        $dto->note = $data['note'] ?? null;
        $dto->isAdminDelete = true;
        $dto->deletedBy = $data['admin_user_id'] ?? null;

        $this->deletionService->softDeleteAccount($dto);

        $this->deletionService->hardDeleteAccount($dto->userId);
    }
}
