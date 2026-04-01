<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\CommandStatus;
use App\Enums\MessageStatus;
use App\Enums\ProcessingStatus;
use App\Models\Command;
use App\Models\Network;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Command>
 */
class CommandFactory extends Factory
{
    protected $model = Command::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'network_id'        => Network::factory(),
            'created_by'        => User::factory(),
            'type'              => 'send_data',
            'node_address'      => strtoupper(fake()->regexify('[0-9A-F]{6}')),
            'request_id'        => fake()->numberBetween(100_000_000, 4_294_967_295),
            'source_ep'         => fake()->numberBetween(1, 255),
            'dest_ep'           => fake()->numberBetween(1, 255),
            'payload'           => strtoupper(fake()->regexify('[0-9A-F]{8}')),
            'no_packet_id'      => false,
            'packet_id'         => strtoupper(fake()->regexify('[0-9A-F]{4}')),
            'processing_status' => ProcessingStatus::Pending,
            'message_status'    => MessageStatus::WaitingResponse,
            'retry_count'       => 0,
            'requested_at'      => now(),

            // Legacy
            'user_id'   => null,
            'device_id' => null,
            'status'    => CommandStatus::PENDING,
        ];
    }

    /**
     * Command in Failed processing state.
     */
    public function failed(): static
    {
        return $this->state([
            'processing_status' => ProcessingStatus::Failed,
            'error_message'     => 'No reply after 3 retries',
        ]);
    }

    /**
     * Node provisioning command type (used by provisioning module).
     */
    public function provisioning(): static
    {
        return $this->state([
            'type'           => 'node_provisioning',
            'node_address'   => null,
            'message_status' => null,
        ]);
    }
}
