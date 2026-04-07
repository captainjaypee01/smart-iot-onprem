<?php

declare(strict_types=1);

namespace App\Actions\Gateway;

use App\Models\Gateway;

final class DeleteGatewayAction
{
    public function execute(Gateway $gateway): void
    {
        $gateway->delete();
    }
}
