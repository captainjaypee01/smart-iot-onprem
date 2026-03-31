<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ProvisioningNodeStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProvisioningBatchNode extends Model
{
    use HasFactory;

    protected $fillable = [
        'provisioning_batch_id',
        'service_id',
        'node_address',
        'status',
        'last_command_id',
    ];

    protected $casts = [
        'status' => ProvisioningNodeStatus::class,
    ];

    public function batch(): BelongsTo
    {
        return $this->belongsTo(ProvisioningBatch::class);
    }
}
