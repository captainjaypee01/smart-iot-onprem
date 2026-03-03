<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Contracts\OutboxPublisherContract;
use App\Models\OutboxEvent;
use Illuminate\Console\Command;

class PublishOutboxEventsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'outbox:publish 
                            {--limit=100 : Maximum number of events to process per run}
                            {--max-attempts=3 : Maximum retry attempts before skipping}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Publish unpublished outbox events to Redis Streams';

    public function __construct(
        private readonly OutboxPublisherContract $publisher
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $limit = (int) $this->option('limit');
        $maxAttempts = (int) $this->option('max-attempts');

        $events = OutboxEvent::whereNull('published_at')
            ->where('attempts', '<', $maxAttempts)
            ->orderBy('created_at')
            ->limit($limit)
            ->get();

        if ($events->isEmpty()) {
            $this->info('No unpublished events found.');

            return Command::SUCCESS;
        }

        $this->info("Processing {$events->count()} outbox events...");

        $published = 0;
        $failed = 0;

        foreach ($events as $event) {
            if ($this->publisher->publish($event)) {
                $published++;
            } else {
                $failed++;
            }
        }

        $this->info("Published: {$published}, Failed: {$failed}");

        return Command::SUCCESS;
    }
}
