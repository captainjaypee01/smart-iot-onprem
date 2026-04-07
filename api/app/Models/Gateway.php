<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\GatewayStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Gateway extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'network_id',
        'gateway_id',
        'sink_id',
        'service_id',
        'asset_id',
        'device_key',
        'location',
        'ip_address',
        'gateway_version',
        'name',
        'description',
        'is_test_mode',
        'last_seen_at',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'is_test_mode' => 'boolean',
        'last_seen_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // ── Relations ─────────────────────────────────────────────────────────────

    public function network(): BelongsTo
    {
        return $this->belongsTo(Network::class);
    }

    // ── Computed Attributes ───────────────────────────────────────────────────

    /**
     * Derive gateway online/offline/unknown status from last_seen_at.
     * Status is never stored in the database.
     */
    protected function status(): Attribute
    {
        return Attribute::make(
            get: function (): GatewayStatus {
                if ($this->last_seen_at === null) {
                    return GatewayStatus::Unknown;
                }

                $thresholdMinutes = (int) config('iot.gateway_online_threshold_minutes', 10);

                if ($this->last_seen_at->gte(now()->subMinutes($thresholdMinutes))) {
                    return GatewayStatus::Online;
                }

                return GatewayStatus::Offline;
            }
        );
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeForNetwork(Builder $query, int $networkId): Builder
    {
        return $query->where('network_id', $networkId)->whereNull('deleted_at');
    }
}
