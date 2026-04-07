<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class NodeType extends Model
{
    use HasFactory;

    protected $table = 'node_types';

    protected $guarded = [];

    public function networks(): BelongsToMany
    {
        return $this->belongsToMany(Network::class, 'network_node_types')
            ->withPivot('network_id', 'node_type_id');
    }
}
