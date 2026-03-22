<?php

declare(strict_types=1);

namespace App\DTO\Roles;

readonly class UpdateRoleDTO
{
    /**
     * null means "field omitted, do not touch that pivot".
     *
     * @param int[]|null $featureIds
     * @param int[]|null $permissionIds
     * @param int[]|null $networkIds
     */
    public function __construct(
        public ?string $name,
        public ?bool $isSystemRole,
        public ?array $featureIds,
        public ?array $permissionIds,
        public ?array $networkIds,
    ) {}
}

