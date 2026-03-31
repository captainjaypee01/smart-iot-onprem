<?php

declare(strict_types=1);

namespace App\DTO\Provisioning;

readonly class StoreProvisioningBatchDTO
{
    /**
     * @param array<int, array{service_id: string, node_address: string}> $nodes
     */
    public function __construct(
        public int $networkId,
        public int $submittedBy,
        public string $targetNodeId,
        public bool $isAutoRegister,
        public array $nodes,
    ) {}
}
