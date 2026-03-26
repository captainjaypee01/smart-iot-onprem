<?php

declare(strict_types=1);

namespace App\DTO\Roles;

readonly class StoreRoleDTO
{
    /**
     * @param int[] $featureIds
     * @param int[] $permissionIds
     * @param int[] $networkIds
     */
    public function __construct(
        public string $name,
        /** @var int[] */
        public array $companyIds,
        public bool $isSystemRole,
        public array $featureIds,
        public array $permissionIds,
        public array $networkIds,
    ) {}
}

