<?php

declare(strict_types=1);

namespace App\Actions\Gateway;

use App\DTO\Gateway\UpdateGatewayDTO;
use App\Models\Gateway;

final class UpdateGatewayAction
{
    public function execute(Gateway $gateway, UpdateGatewayDTO $dto): Gateway
    {
        $gateway->fill([
            'name'         => $dto->name,
            'description'  => $dto->description,
            'is_test_mode' => $dto->isTestMode,
            'service_id'   => $dto->serviceId,
            'asset_id'     => $dto->assetId,
            'device_key'   => $dto->deviceKey,
            'location'     => $dto->location,
        ]);

        $gateway->save();

        return $gateway->load('network');
    }
}
