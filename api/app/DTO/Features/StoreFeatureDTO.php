<?php

declare(strict_types=1);

namespace App\DTO\Features;

final readonly class StoreFeatureDTO
{
    public function __construct(
        public string $key,
        public string $name,
        public string $group,
        public int $groupOrder,
        public string $route,
        public ?string $icon,
        public int $sortOrder,
        public bool $isActive,
    ) {
    }
}

