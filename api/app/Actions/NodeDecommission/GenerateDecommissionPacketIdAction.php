<?php

declare(strict_types=1);

namespace App\Actions\NodeDecommission;

use App\Models\NodeDecommissionLog;
use RuntimeException;

class GenerateDecommissionPacketIdAction
{
    private const int MAX_PACKET_ID = 0xFFFF;

    /**
     * Return the next sequential 4-char hex packet ID (zero-padded).
     * Finds the global max across both packet_id and verification_packet_id columns
     * so all issued IDs are unique. Starts at 0001 when no logs exist yet.
     *
     * @throws RuntimeException when the 16-bit packet ID space is exhausted
     */
    public function next(): string
    {
        // Fixed-length zero-padded hex strings sort the same as numeric order,
        // so max() on the string column gives the numerically largest value.
        $maxDecommission = NodeDecommissionLog::query()
            ->whereNotNull('packet_id')
            ->max('packet_id');

        $maxVerification = NodeDecommissionLog::query()
            ->whereNotNull('verification_packet_id')
            ->max('verification_packet_id');

        $current = 0;

        if ($maxDecommission !== null) {
            $current = max($current, hexdec($maxDecommission));
        }

        if ($maxVerification !== null) {
            $current = max($current, hexdec($maxVerification));
        }

        $next = $current + 1;

        if ($next > self::MAX_PACKET_ID) {
            throw new RuntimeException('Packet ID space exhausted (max 65535 / 0xFFFF).');
        }

        return str_pad(dechex($next), 4, '0', STR_PAD_LEFT);
    }
}
