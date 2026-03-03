<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\OutboxPublisherContract;
use App\Models\OutboxEvent;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class OutboxPublisherService implements OutboxPublisherContract
{
    private const STREAM_KEY = 'outbox:events';
    private const MAX_RETRIES = 3;

    public function publish(OutboxEvent $event): bool
    {
        try {
            $streamId = Redis::xAdd(
                self::STREAM_KEY,
                '*',
                [
                    'event_id' => (string) $event->id,
                    'aggregate_type' => $event->aggregate_type,
                    'aggregate_id' => $event->aggregate_id,
                    'event_name' => $event->event_name,
                    'payload' => json_encode($event->payload, JSON_THROW_ON_ERROR),
                    'created_at' => $event->created_at->toIso8601String(),
                ],
                maxLen: 10000, // Keep last 10k events
                approximate: true
            );

            if ($streamId) {
                $this->markAsPublished($event);

                logger()->withContext([
                    'outbox_event_id' => $event->id,
                    'stream_id' => $streamId,
                ])->info('Outbox event published to Redis Streams');

                return true;
            }

            return false;
        } catch (\Exception $e) {
            $this->markAsFailed($event, $e->getMessage());

            logger()->withContext([
                'outbox_event_id' => $event->id,
                'error' => $e->getMessage(),
            ])->error('Failed to publish outbox event to Redis Streams');

            return false;
        }
    }

    public function markAsPublished(OutboxEvent $event): void
    {
        $event->update([
            'published_at' => now(),
            'attempts' => $event->attempts + 1,
            'last_error' => null,
        ]);
    }

    public function markAsFailed(OutboxEvent $event, string $error): void
    {
        $event->update([
            'attempts' => $event->attempts + 1,
            'last_error' => Str::limit($error, 1000), // Limit error message length
        ]);
    }
}
