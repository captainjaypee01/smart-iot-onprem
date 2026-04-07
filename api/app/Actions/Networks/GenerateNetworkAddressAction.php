<?php

declare(strict_types=1);

// app/Actions/Networks/GenerateNetworkAddressAction.php

namespace App\Actions\Networks;

use App\Models\Network;
use Illuminate\Support\Str;
use RuntimeException;

final class GenerateNetworkAddressAction
{
    public function execute(string $name): string
    {
        $attempts = 0;

        do {
            if (++$attempts > 10) {
                throw new RuntimeException('Could not generate a unique network address.');
            }

            $raw = now()->toIso8601String().$name.Str::random(16);
            $hash = md5($raw);
            $hex6 = strtoupper(substr($hash, 0, 6));
        } while (Network::where('network_address', $hex6)->exists());

        return $hex6;
    }
}
