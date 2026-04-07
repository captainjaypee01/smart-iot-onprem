<?php

declare(strict_types=1);

namespace App\Enums;

enum GatewayStatus: string
{
    case Online = 'online';
    case Offline = 'offline';
    case Unknown = 'unknown';

    public function label(): string
    {
        return match ($this) {
            self::Online => 'Online',
            self::Offline => 'Offline',
            self::Unknown => 'Unknown',
        };
    }
}
