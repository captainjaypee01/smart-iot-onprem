<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\NodeDecommissionStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $node_id
 * @property int $network_id
 * @property int|null $initiated_by
 * @property int|null $command_id
 * @property int|null $verification_command_id
 * @property NodeDecommissionStatus $status
 * @property string|null $packet_id
 * @property string|null $payload
 * @property bool $is_manual
 * @property string|null $verification_packet_id
 * @property Carbon|null $verification_sent_at
 * @property Carbon|null $verification_expires_at
 * @property string|null $error_message
 * @property Carbon|null $decommissioned_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read bool $decommission_timed_out
 * @property-read bool $verification_timed_out
 * @property-read Node|null $node
 * @property-read Network|null $network
 * @property-read User|null $initiatedBy
 */
class NodeDecommissionLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'node_id',
        'network_id',
        'initiated_by',
        'command_id',
        'verification_command_id',
        'status',
        'packet_id',
        'payload',
        'is_manual',
        'verification_packet_id',
        'verification_sent_at',
        'verification_expires_at',
        'error_message',
        'decommissioned_at',
    ];

    /** @var list<string> */
    protected $appends = ['decommission_timed_out', 'verification_timed_out'];

    /**
     * @return array<string, string|class-string>
     */
    protected function casts(): array
    {
        return [
            'is_manual' => 'boolean',
            'command_id' => 'integer',
            'verification_command_id' => 'integer',
            'verification_sent_at' => 'datetime',
            'verification_expires_at' => 'datetime',
            'decommissioned_at' => 'datetime',
            'status' => NodeDecommissionStatus::class,
        ];
    }

    // ── Computed Attributes ────────────────────────────────────────────────────

    /**
     * Returns true when the decommission command has been pending for 2+ minutes
     * without a verification command being sent yet.
     * This is when the "Verify" button should appear on the frontend.
     */
    public function getDecommissionTimedOutAttribute(): bool
    {
        return $this->status === NodeDecommissionStatus::Pending
            && $this->verification_sent_at === null
            && now()->greaterThan($this->created_at->addMinutes(2));
    }

    /**
     * Returns true when the verification window has expired and the log is still pending.
     * This is when the "Manual Decommission" button should appear on the frontend.
     */
    public function getVerificationTimedOutAttribute(): bool
    {
        return $this->verification_expires_at !== null
            && now()->greaterThan($this->verification_expires_at)
            && $this->status === NodeDecommissionStatus::Pending;
    }

    // ── Relationships ──────────────────────────────────────────────────────────

    /**
     * @return BelongsTo<Node, $this>
     */
    public function node(): BelongsTo
    {
        return $this->belongsTo(Node::class, 'node_id');
    }

    /**
     * @return BelongsTo<Network, $this>
     */
    public function network(): BelongsTo
    {
        return $this->belongsTo(Network::class, 'network_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function initiatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by');
    }

    // ── Scopes ─────────────────────────────────────────────────────────────────

    /**
     * @param  Builder<NodeDecommissionLog>  $query
     * @return Builder<NodeDecommissionLog>
     */
    public function scopeForNetwork(Builder $query, int $networkId): Builder
    {
        return $query->where('network_id', $networkId);
    }

    /**
     * @param  Builder<NodeDecommissionLog>  $query
     * @return Builder<NodeDecommissionLog>
     */
    public function scopeForNode(Builder $query, int $nodeId): Builder
    {
        return $query->where('node_id', $nodeId);
    }
}
