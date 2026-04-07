<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CommandStatus;
use App\Enums\MessageStatus;
use App\Enums\ProcessingStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Command extends Model
{
    use HasFactory;

    protected $fillable = [
        // Legacy
        'user_id',
        'device_id',
        'status',

        // Core
        'network_id',
        'created_by',
        'retry_by',
        'type',
        'node_address',
        'request_id',

        // Addressing
        'source_ep',
        'dest_ep',

        // Payload
        'payload',

        // Tracking
        'no_packet_id',
        'packet_id',

        // Status
        'processing_status',
        'message_status',

        // Retry
        'retry_count',
        'retry_at',

        // Error
        'error_code',
        'error_message',

        // Timestamps
        'requested_at',
        'dispatched_at',
        'acked_at',
        'completed_at',
    ];

    protected $casts = [
        // Legacy
        'status' => CommandStatus::class,

        // New
        'network_id' => 'integer',
        'created_by' => 'integer',
        'retry_by' => 'integer',
        'request_id' => 'integer',
        'source_ep' => 'integer',
        'dest_ep' => 'integer',
        'no_packet_id' => 'boolean',
        'processing_status' => ProcessingStatus::class,
        'message_status' => MessageStatus::class,
        'retry_count' => 'integer',

        // Dates
        'requested_at' => 'datetime',
        'dispatched_at' => 'datetime',
        'acked_at' => 'datetime',
        'completed_at' => 'datetime',
        'retry_at' => 'datetime',
    ];

    // ── Relations ─────────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function network(): BelongsTo
    {
        return $this->belongsTo(Network::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function retryBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'retry_by');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    /**
     * Scope to networks accessible by the given user.
     * Superadmins see all; others are scoped to their role_networks.
     */
    public function scopeForUser(Builder $query, ?User $user): Builder
    {
        if ($user === null || $user->is_superadmin) {
            return $query;
        }

        $networkIds = $user->role?->networks()->pluck('networks.id')->all() ?? [];

        return $query->whereIn('network_id', $networkIds);
    }

    /**
     * Exclude node_provisioning type commands (those belong to the provisioning module).
     */
    public function scopeExcludeNodeProvisioning(Builder $query): Builder
    {
        return $query->where('type', '!=', 'node_provisioning');
    }

    // ── Legacy helpers (Node Provisioning compatibility) ──────────────────────

    public function transitionTo(CommandStatus $newStatus): bool
    {
        if (! $this->status->canTransitionTo($newStatus)) {
            return false;
        }

        $this->status = $newStatus;

        match ($newStatus) {
            CommandStatus::DISPATCHED => $this->dispatched_at = now(),
            CommandStatus::ACKED => $this->acked_at = now(),
            CommandStatus::COMPLETED => $this->completed_at = now(),
            default => null,
        };

        return $this->save();
    }
}
