<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\NodeStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $network_id
 * @property int|null $zone_id
 * @property int|null $node_config_id
 * @property int|null $asset_id
 * @property string $name
 * @property string $node_address
 * @property string $service_id
 * @property string|null $product_type
 * @property string|null $building_name
 * @property string|null $building_level
 * @property string|null $sector_name
 * @property string|null $postal_id
 * @property bool $is_online
 * @property Carbon|null $last_online_at
 * @property Carbon|null $provisioned_at
 * @property NodeStatus $status
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read Network|null $network
 * @property-read NodeConfig|null $nodeConfig
 * @property-read \Illuminate\Database\Eloquent\Collection<int, NodeDecommissionLog> $decommissionLogs
 */
class Node extends Model
{
    use HasFactory;

    protected $fillable = [
        'network_id',
        'zone_id',
        'node_config_id',
        'asset_id',
        'name',
        'node_address',
        'service_id',
        'product_type',
        'building_name',
        'building_level',
        'sector_name',
        'postal_id',
        'is_online',
        'last_online_at',
        'provisioned_at',
        'status',
    ];

    /**
     * @return array<string, string|class-string>
     */
    protected function casts(): array
    {
        return [
            'is_online' => 'boolean',
            'last_online_at' => 'datetime',
            'provisioned_at' => 'datetime',
            'status' => NodeStatus::class,
        ];
    }

    // ── Relationships ──────────────────────────────────────────────────────────

    /**
     * @return BelongsTo<Network, $this>
     */
    public function network(): BelongsTo
    {
        return $this->belongsTo(Network::class);
    }

    /**
     * @return BelongsTo<NodeConfig, $this>
     */
    public function nodeConfig(): BelongsTo
    {
        return $this->belongsTo(NodeConfig::class, 'node_config_id');
    }

    /**
     * @return HasMany<NodeDecommissionLog, $this>
     */
    public function decommissionLogs(): HasMany
    {
        return $this->hasMany(NodeDecommissionLog::class, 'node_id');
    }

    // ── Scopes ─────────────────────────────────────────────────────────────────

    /**
     * Scope to nodes eligible for decommissioning (not yet decommissioned).
     *
     * @param  Builder<Node>  $query
     * @return Builder<Node>
     */
    public function scopeDecommissionable(Builder $query): Builder
    {
        return $query->where('status', '!=', NodeStatus::Decommissioned->value);
    }
}
