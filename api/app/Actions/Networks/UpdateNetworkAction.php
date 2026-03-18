<?php

declare(strict_types=1);

// app/Actions/Networks/UpdateNetworkAction.php

namespace App\Actions\Networks;

use App\DTO\Networks\UpdateNetworkDTO;
use App\Models\Network;
use Illuminate\Support\Facades\DB;

final class UpdateNetworkAction
{
    public function execute(Network $network, UpdateNetworkDTO $dto): Network
    {
        return DB::transaction(function () use ($network, $dto): Network {
            $attributes = [];

            if ($dto->name !== null) {
                $attributes['name'] = $dto->name;
            }

            if ($dto->networkAddress !== null) {
                $attributes['network_address'] = $this->normalizeAddress($dto->networkAddress);
            }

            if ($dto->description !== null) {
                $attributes['description'] = $dto->description;
            }

            if ($dto->remarks !== null) {
                $attributes['remarks'] = $dto->remarks;
            }

            if ($dto->isActive !== null) {
                $attributes['is_active'] = $dto->isActive;
            }

            if ($dto->diagnosticInterval !== null) {
                $attributes['diagnostic_interval'] = $dto->diagnosticInterval;
            }

            if ($dto->alarmThreshold !== null) {
                $attributes['alarm_threshold'] = $dto->alarmThreshold;
            }

            if ($dto->alarmThresholdUnit !== null) {
                $attributes['alarm_threshold_unit'] = $dto->alarmThresholdUnit;
            }

            if ($dto->wirepasVersion !== null) {
                $attributes['wirepas_version'] = $dto->wirepasVersion;
            }

            if ($dto->commissionedDate !== null) {
                $attributes['commissioned_date'] = $dto->commissionedDate;
            }

            if ($dto->isMaintenance !== null) {
                $attributes['is_maintenance'] = $dto->isMaintenance;
            }

            if ($dto->maintenanceStartAt !== null) {
                $attributes['maintenance_start_at'] = $dto->maintenanceStartAt;
            }

            if ($dto->maintenanceEndAt !== null) {
                $attributes['maintenance_end_at'] = $dto->maintenanceEndAt;
            }

            if ($dto->hasMonthlyReport !== null) {
                $attributes['has_monthly_report'] = $dto->hasMonthlyReport;
            }

            if ($attributes !== []) {
                $network->fill($attributes);
                $network->save();
            }

            if ($dto->hasNodeTypes) {
                $network->nodeTypes()->sync($dto->nodeTypeIds ?? []);
            }

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

