<?php

declare(strict_types=1);

namespace App\Actions\NodeDecommission;

use App\Enums\NodeDecommissionStatus;
use App\Enums\NodeStatus;
use App\Models\Node;
use App\Models\NodeDecommissionLog;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;

class ManualDecommissionAction
{
    /**
     * Manually mark a node as decommissioned without sending an IoT command.
     *
     * @throws HttpResponseException 422 if the node is already decommissioned
     */
    public function execute(Node $node, int $initiatedBy): NodeDecommissionLog
    {
        if ($node->status === NodeStatus::Decommissioned) {
            throw new HttpResponseException(
                response()->json(['message' => 'Node is already decommissioned.'], 422)
            );
        }

        return DB::transaction(function () use ($node, $initiatedBy): NodeDecommissionLog {
            // The pending attempt is now closed — automated decommission failed (timed out).
            // Marked 'failed' so history is accurate and no action buttons re-appear.
            NodeDecommissionLog::query()
                ->forNode($node->id)
                ->where('status', NodeDecommissionStatus::Pending->value)
                ->update(['status' => NodeDecommissionStatus::Failed->value]);

            $log = NodeDecommissionLog::create([
                'node_id'           => $node->id,
                'network_id'        => $node->network_id,
                'initiated_by'      => $initiatedBy,
                'status'            => NodeDecommissionStatus::Manual->value,
                'is_manual'         => true,
                'decommissioned_at' => now(),
                'packet_id'         => null,
                'payload'           => null,
            ]);

            $node->update(['status' => NodeStatus::Decommissioned->value]);

            return $log;
        });
    }
}
