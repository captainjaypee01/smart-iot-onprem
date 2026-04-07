<?php

declare(strict_types=1);

namespace App\Enums;

enum ProcessingStatus: int
{
    case Pending = 1;
    case Processing = 2;
    case Sent = 3;
    case Failed = 4;

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Processing => 'Processing',
            self::Sent => 'Sent',
            self::Failed => 'Failed',
        };
    }

    /**
     * Terminal states cannot be overwritten by the IoT service.
     */
    public function isTerminal(): bool
    {
        return $this === self::Failed;
    }
}
