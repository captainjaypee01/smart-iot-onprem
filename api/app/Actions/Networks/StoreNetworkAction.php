<?php

declare(strict_types=1);

// app/Actions/Networks/StoreNetworkAction.php

namespace App\Actions\Networks;

use App\DTO\Networks\StoreNetworkDTO;
use App\Models\Network;
use Illuminate\Support\Facades\DB;

final class StoreNetworkAction
{
    public function execute(StoreNetworkDTO $dto): Network
    {
        return DB::transaction(function () use ($dto): Network {
            $normalizedAddress = $this->normalizeAddress($dto->networkAddress);

            $network = Network::create([
                'name' => $dto->name,
                'network_address' => $normalizedAddress,
                'description' => $dto->description,
                'remarks' => $dto->remarks,
                'is_active' => $dto->isActive,
                'diagnostic_interval' => $dto->diagnosticInterval,
                'alarm_threshold' => $dto->alarmThreshold,
                'alarm_threshold_unit' => $dto->alarmThresholdUnit,
                'wirepas_version' => $dto->wirepasVersion,
                'commissioned_date' => $dto->commissionedDate,
                'is_maintenance' => $dto->isMaintenance,
                'maintenance_start_at' => $dto->maintenanceStartAt,
                'maintenance_end_at' => $dto->maintenanceEndAt,
                'has_monthly_report' => $dto->hasMonthlyReport,
            ]);

            $network->nodeTypes()->sync($dto->nodeTypeIds ?? []);

            return $network->load('nodeTypes');
        });
    }

    private function normalizeAddress(string $address): string
    {
        if (str_starts_with($address, '0x') || str_starts_with($address, '0X')) {
            $hex = substr($address, 2);
        } else {
            $hex = $address;
        }

        return strtoupper($hex);
    }
}
