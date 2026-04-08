<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('node_decommission_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('network_id')
                ->constrained('networks')
                ->restrictOnDelete();

            $table->foreignId('node_id')
                ->constrained('nodes')
                ->restrictOnDelete();

            $table->foreignId('initiated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Plain unsignedBigInteger (no FK) — commands uses a composite PK due to Postgres partitioning.
            $table->unsignedBigInteger('command_id')->nullable()
                ->comment('Linked commands row for the decommission command. Null for manual decommissions or pre-integration logs.');

            $table->unsignedBigInteger('verification_command_id')->nullable()
                ->comment('Linked commands row for the verification (pulse) command. Null until verify is sent.');

            $table->string('status')->default('pending')
                ->comment('Enum: pending|completed|failed|manual');

            $table->string('packet_id', 4)->nullable()
                ->comment('2-byte hex tracking ID for the decommission command, e.g. "ab12". NULL when is_manual = true.');

            $table->string('payload')->nullable()
                ->comment('The hex payload sent in the decommission command. NULL when is_manual = true.');

            $table->boolean('is_manual')->default(false)
                ->comment('true when this log entry was created via the manual decommission action');

            $table->string('verification_packet_id', 4)->nullable()
                ->comment('2-byte hex tracking ID for the most recent verification command sent.');

            $table->timestamp('verification_sent_at')->nullable()
                ->comment('Timestamp when the most recent verification command was sent.');

            $table->timestamp('verification_expires_at')->nullable()
                ->comment('Set to verification_sent_at + 2 minutes.');

            $table->text('error_message')->nullable()
                ->comment('Human-readable failure reason.');

            $table->timestamp('decommissioned_at')->nullable()
                ->comment('Set when status transitions to completed or manual.');

            $table->timestamps();

            // Indexes
            $table->index('node_id');
            $table->index('network_id');
            $table->index('initiated_by');
            $table->index('command_id');
            $table->index('verification_command_id');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('node_decommission_logs');
    }
};
