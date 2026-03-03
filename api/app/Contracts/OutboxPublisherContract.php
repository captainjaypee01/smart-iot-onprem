<?php

declare(strict_types=1);

namespace App\Contracts;

use App\Models\OutboxEvent;

interface OutboxPublisherContract
{
    /**
     * Publish an outbox event to Redis Streams.
     *
     * @return bool True if published successfully, false otherwise
     */
    public function publish(OutboxEvent $event): bool;

    /**
     * Mark an event as published.
     */
    public function markAsPublished(OutboxEvent $event): void;

    /**
     * Mark an event as failed with error message.
     */
    public function markAsFailed(OutboxEvent $event, string $error): void;
}
