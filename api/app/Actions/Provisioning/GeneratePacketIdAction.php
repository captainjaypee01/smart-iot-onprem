<?php

declare(strict_types=1);

namespace App\Actions\Provisioning;

use App\Models\ProvisioningBatch;
use RuntimeException;

final class GeneratePacketIdAction
{
    public function execute(): string
    {
        $attempts = 0;

        do {
            if (++$attempts > 10) {
                throw new RuntimeException('Could not generate a unique packet ID after 10 attempts.');
            }

            $packetId = strtolower(bin2hex(random_bytes(2)));
        } while (ProvisioningBatch::where('packet_id', $packetId)->exists());

        return $packetId;
    }
}
