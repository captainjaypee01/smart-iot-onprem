<?php

declare(strict_types=1);

namespace App\Actions\Gateway;

use App\DTO\Gateway\CreateGatewayDTO;
use App\Models\Gateway;
use App\Models\Network;
use Illuminate\Support\Facades\DB;

final class CreateGatewayAction
{
    public function execute(CreateGatewayDTO $dto): Gateway
    {
        return DB::transaction(function () use ($dto): Gateway {
            // Lock the network row to prevent concurrent prefix/sink_id races.
            $network = Network::lockForUpdate()->findOrFail($dto->networkId);

            if ($network->gateway_prefix === null) {
                // First gateway for this network — accept the request-supplied prefix.
                $prefix = $dto->gatewayPrefix;
                $network->gateway_prefix = $prefix;
                $network->save();
            } else {
                // Prefix already set — ignore any supplied value and use the stored one.
                $prefix = $network->gateway_prefix;
            }

            // Count ALL gateways for this network, including soft-deleted ones,
            // to guarantee gateway_id uniqueness over the lifetime of the network.
            $count = Gateway::withTrashed()
                ->where('network_id', $dto->networkId)
                ->count();

            $sinkId = str_pad((string) ($count + 1), 2, '0', STR_PAD_LEFT);
            $gatewayId = $prefix.'_'.$sinkId;

            $gateway = Gateway::create([
                'network_id'   => $dto->networkId,
                'gateway_id'   => $gatewayId,
                'sink_id'      => $sinkId,
                'service_id'   => $dto->serviceId,
                'asset_id'     => $dto->assetId,
                'device_key'   => $dto->deviceKey,
                'location'     => $dto->location,
                'name'         => $dto->name,
                'description'  => $dto->description,
                'is_test_mode' => $dto->isTestMode,
                'last_seen_at' => null,
            ]);

            return $gateway->load('network');
        });
    }
}
