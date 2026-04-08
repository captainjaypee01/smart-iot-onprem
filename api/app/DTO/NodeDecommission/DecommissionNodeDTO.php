<?php

declare(strict_types=1);

namespace App\DTO\NodeDecommission;

final readonly class DecommissionNodeDTO
{
    public function __construct(
        public int $networkId,
        public int $initiatedBy,
    ) {}
}
