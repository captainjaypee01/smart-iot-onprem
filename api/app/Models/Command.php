<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CommandStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Command extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'user_id',
        'device_id',
        'type',
        'payload',
        'status',
        'correlation_id',
        'requested_at',
        'dispatched_at',
        'acked_at',
        'completed_at',
        'error_code',
        'error_message',
    ];

    protected $casts = [
        'user_id' => 'string',
        'payload' => 'array',
        'status' => CommandStatus::class,
        'requested_at' => 'datetime',
        'dispatched_at' => 'datetime',
        'acked_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transitionTo(CommandStatus $newStatus): bool
    {
        if (! $this->status->canTransitionTo($newStatus)) {
            return false;
        }

        $this->status = $newStatus;

        // Set timestamp based on status
        match ($newStatus) {
            CommandStatus::DISPATCHED => $this->dispatched_at = now(),
            CommandStatus::ACKED => $this->acked_at = now(),
            CommandStatus::COMPLETED => $this->completed_at = now(),
            default => null,
        };

        return $this->save();
    }
}
