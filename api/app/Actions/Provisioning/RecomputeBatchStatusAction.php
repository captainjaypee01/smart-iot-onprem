<?php

declare(strict_types=1);

namespace App\Actions\Provisioning;

use App\Enums\ProvisioningBatchStatus;
use App\Enums\ProvisioningNodeStatus;
use App\Models\ProvisioningBatch;

final class RecomputeBatchStatusAction
{
    public function execute(ProvisioningBatch $batch): void
    {
        $nodes = $batch->nodes()->get();
        $total = $nodes->count();
        $provisioned = $nodes->where('status', ProvisioningNodeStatus::Provisioned)->count();
        $failed = $nodes->where('status', ProvisioningNodeStatus::Failed)->count();

        $status = match (true) {
            $provisioned === $total => ProvisioningBatchStatus::Complete,
            $failed === $total      => ProvisioningBatchStatus::Failed,
            $provisioned > 0        => ProvisioningBatchStatus::Partial,
            default                 => ProvisioningBatchStatus::Pending,
        };

        $batch->update([
            'status' => $status,
            'provisioned_nodes' => $provisioned,
        ]);
    }
}
