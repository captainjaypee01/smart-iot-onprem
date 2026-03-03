<?php

declare(strict_types=1);

namespace App\Enums;

enum CommandStatus: string
{
    case PENDING = 'pending';
    case QUEUED = 'queued';
    case DISPATCHED = 'dispatched';
    case ACKED = 'acked';
    case COMPLETED = 'completed';
    case FAILED = 'failed';
    case TIMEOUT = 'timeout';

    public function canTransitionTo(self $newStatus): bool
    {
        return match ($this) {
            self::PENDING => in_array($newStatus, [self::QUEUED, self::FAILED, self::TIMEOUT], true),
            self::QUEUED => in_array($newStatus, [self::DISPATCHED, self::FAILED, self::TIMEOUT], true),
            self::DISPATCHED => in_array($newStatus, [self::ACKED, self::FAILED, self::TIMEOUT], true),
            self::ACKED => in_array($newStatus, [self::COMPLETED, self::FAILED], true),
            self::COMPLETED, self::FAILED, self::TIMEOUT => false,
        };
    }

    public function isTerminal(): bool
    {
        return in_array($this, [self::COMPLETED, self::FAILED, self::TIMEOUT], true);
    }
}
