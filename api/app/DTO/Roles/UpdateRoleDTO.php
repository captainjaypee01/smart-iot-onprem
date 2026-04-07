<?php

declare(strict_types=1);

namespace App\DTO\Roles;

readonly class UpdateRoleDTO
{
    /**
     * null means "field omitted, do not touch that pivot".
     *
     * @param  int[]|null  $featureIds
     * @param  int[]|null  $permissionIds
     * @param  int[]|null  $networkIds
     * @param  int[]|null  $companyIds
     */
    public function __construct(
        public ?string $name,
        public ?bool $isSystemRole,
        /** @var int[]|null */
        public ?array $companyIds,
        public ?array $featureIds,
        public ?array $permissionIds,
        public ?array $networkIds,
    ) {}
}
