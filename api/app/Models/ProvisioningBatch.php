<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ProvisioningBatchStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProvisioningBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'network_id',
        'packet_id',
        'target_node_id',
        'submitted_by',
        'status',
        'total_nodes',
        'provisioned_nodes',
        'is_auto_register',
        'command_sent',
    ];

    protected $casts = [
        'status' => ProvisioningBatchStatus::class,
        'total_nodes' => 'integer',
        'provisioned_nodes' => 'integer',
        'is_auto_register' => 'boolean',
    ];

    public function network(): BelongsTo
    {
        return $this->belongsTo(Network::class);
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function nodes(): HasMany
    {
        return $this->hasMany(ProvisioningBatchNode::class);
    }
}
