<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Network extends Model
{
    use HasFactory;

    protected $table = 'networks';

    protected $guarded = [];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'diagnostic_interval' => 'integer',
        'alarm_threshold' => 'integer',
        'commissioned_date' => 'date',
        'is_maintenance' => 'boolean',
        'maintenance_start_at' => 'datetime',
        'maintenance_end_at' => 'datetime',
        'has_monthly_report' => 'boolean',
    ];

    public function nodeTypes(): BelongsToMany
    {
        return $this->belongsToMany(NodeType::class, 'network_node_types')
            ->withPivot('network_id', 'node_type_id');
    }
}

