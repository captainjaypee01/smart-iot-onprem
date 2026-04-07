<?php

declare(strict_types=1);

namespace App\Actions\Gateway;

use App\Models\Gateway;

final class UpdateGatewayLastSeenAction
{
    public function execute(Gateway $gateway, ?string $ipAddress = null, ?string $gatewayVersion = null): void
    {
        $gateway->last_seen_at = now();

        if ($ipAddress !== null) {
            $gateway->ip_address = $ipAddress;
        }

        if ($gatewayVersion !== null) {
            $gateway->gateway_version = $gatewayVersion;
        }

        $gateway->save();
    }
}
