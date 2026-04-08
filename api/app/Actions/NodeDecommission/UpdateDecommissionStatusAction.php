<?php

declare(strict_types=1);

namespace App\Actions\NodeDecommission;

use App\DTO\NodeDecommission\UpdateDecommissionStatusDTO;
use App\Enums\CommandStatus;
use App\Enums\NodeDecommissionStatus;
use App\Enums\NodeStatus;
use App\Models\Command;
use App\Models\NodeDecommissionLog;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;

class UpdateDecommissionStatusAction
{
    /**
     * Process an IoT service ACK for a decommission or verify command.
     *
     * Command type semantics:
     *   decommission + success → 'completed' (node confirmed decommissioned)
     *   verify       + success → 'failed'   (node replied to pulse = still alive, decommission failed)
     *   any          + error   → 'failed'   (command failed or node unreachable)
     *
     * Idempotency rules:
     *   Already 'completed' → no-op, return 200.
     *   Already 'failed'   → no-op, return 200.
     *   Status 'manual'    → 409 (manual decommission cannot be overwritten).
     *
     * @throws HttpResponseException 409 if log status is 'manual'
     */
    public function execute(NodeDecommissionLog $log, UpdateDecommissionStatusDTO $dto): NodeDecommissionLog
    {
        // Idempotency — already terminal
        if ($log->status === NodeDecommissionStatus::Completed) {
            return $log;
        }

        if ($log->status === NodeDecommissionStatus::Failed) {
            return $log;
        }

        // Manual decommission cannot be overwritten by IoT ACK
        if ($log->status === NodeDecommissionStatus::Manual) {
            throw new HttpResponseException(
                response()->json(['message' => 'Manual decommission cannot be overwritten by IoT ack.'], 409)
            );
        }

        return DB::transaction(function () use ($log, $dto): NodeDecommissionLog {
            if ($dto->commandType === 'decommission' && $dto->result === 'success') {
                // Node confirmed decommissioned via ACK
                $log->update([
                    'status'            => NodeDecommissionStatus::Completed->value,
                    'decommissioned_at' => now(),
                ]);
                $log->node()->update(['status' => NodeStatus::Decommissioned->value]);
                $this->finaliseCommand($log->command_id, CommandStatus::COMPLETED);

            } elseif ($dto->commandType === 'verify' && $dto->result === 'success') {
                // Node replied to the pulse — it is still alive; decommission failed
                $log->update([
                    'status'        => NodeDecommissionStatus::Failed->value,
                    'error_message' => 'Node is still responding. Decommission command was not effective.',
                ]);
                $this->finaliseCommand($log->verification_command_id, CommandStatus::COMPLETED);

            } else {
                // Any error result (decommission or verify command failed / node unreachable)
                $log->update([
                    'status'        => NodeDecommissionStatus::Failed->value,
                    'error_message' => $dto->errorMessage ?? 'Command failed or node did not respond.',
                ]);
                $commandId = $dto->commandType === 'verify'
                    ? $log->verification_command_id
                    : $log->command_id;
                $this->finaliseCommand($commandId, CommandStatus::FAILED);
            }

            return $log->fresh() ?? $log;
        });
    }

    /**
     * Mark the linked Command row as completed or failed.
     * No-op when command_id is null (e.g. logs created before command integration).
     */
    private function finaliseCommand(?int $commandId, CommandStatus $status): void
    {
        if ($commandId === null) {
            return;
        }

        $updates = ['status' => $status->value];

        if ($status === CommandStatus::COMPLETED) {
            $updates['completed_at'] = now();
        }

        Command::where('id', $commandId)->update($updates);
    }
}
