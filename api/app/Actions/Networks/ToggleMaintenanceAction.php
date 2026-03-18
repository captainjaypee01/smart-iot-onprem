<?php

declare(strict_types=1);

// app/Actions/Networks/ToggleMaintenanceAction.php

namespace App\Actions\Networks;

use App\Models\Network;
use Illuminate\Support\Facades\DB;

final class ToggleMaintenanceAction
{
    public function execute(Network $network, bool $isMaintenance, ?string $maintenanceStartAt, ?string $maintenanceEndAt): Network
    {
        return DB::transaction(function () use ($network, $isMaintenance, $maintenanceStartAt, $maintenanceEndAt): Network {
            if ($isMaintenance === true) {
                $network->is_maintenance       = true;
                $network->maintenance_start_at = $maintenanceStartAt;
                $network->maintenance_end_at   = $maintenanceEndAt;
            } else {
                $network->is_maintenance       = false;
                $network->maintenance_start_at = null;
                $network->maintenance_end_at   = null;
            }

            $network->save();

            return $network->refresh();
        });
    }
}

