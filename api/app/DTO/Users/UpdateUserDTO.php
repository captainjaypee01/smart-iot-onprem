<?php

declare(strict_types=1);

// app/DTO/Users/UpdateUserDTO.php

namespace App\DTO\Users;

readonly class UpdateUserDTO
{
    public function __construct(
        public int $userId,
        public ?string $firstName,
        public ?string $lastName,
        public ?string $email,
        public ?string $username,
        public ?int $roleId,
        public ?int $companyId,
        public ?string $status,
        public int $updatedBy,
    ) {}
}
