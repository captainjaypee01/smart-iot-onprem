<?php

declare(strict_types=1);

// app/DTO/Users/StoreUserDTO.php

namespace App\DTO\Users;

readonly class StoreUserDTO
{
    public function __construct(
        public string $firstName,
        public string $lastName,
        public string $email,
        public ?string $username,
        public int $companyId,
        public int $roleId,
        public int $assignedBy,
        public bool $useInvite,
        public ?string $password,
    ) {}
}
