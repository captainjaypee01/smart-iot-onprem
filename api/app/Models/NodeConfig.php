<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NodeConfig extends Model
{
    protected $fillable = [
        'node_type_id',
    ];

    /**
     * @return BelongsTo<NodeType, $this>
     */
    public function nodeType(): BelongsTo
    {
        return $this->belongsTo(NodeType::class, 'node_type_id');
    }

    /**
     * @return HasMany<Node, $this>
     */
    public function nodes(): HasMany
    {
        return $this->hasMany(Node::class, 'node_config_id');
    }
}
