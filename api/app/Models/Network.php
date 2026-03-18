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

    public function nodeTypes(): BelongsToMany
    {
        return $this->belongsToMany(NodeType::class, 'network_node_types')
            ->withPivot('network_id', 'node_type_id');
    }
}

