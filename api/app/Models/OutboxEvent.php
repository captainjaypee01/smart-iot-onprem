<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OutboxEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'aggregate_type',
        'aggregate_id',
        'event_name',
        'payload',
        'published_at',
        'attempts',
        'last_error',
    ];

    protected $casts = [
        'payload' => 'array',
        'published_at' => 'datetime',
    ];

    public function markAsPublished(): void
    {
        $this->update([
            'published_at' => now(),
        ]);
    }

    public function incrementAttempts(?string $error = null): void
    {
        $this->increment('attempts');
        if ($error) {
            $this->update(['last_error' => $error]);
        }
    }
}
