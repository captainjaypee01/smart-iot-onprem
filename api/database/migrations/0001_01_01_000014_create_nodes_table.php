<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('network_id')
                ->constrained('networks')
                ->restrictOnDelete();
            $table->foreignId('zone_id')
                ->nullable()
                ->constrained('zones')
                ->nullOnDelete();
            $table->foreignId('node_config_id')
                ->nullable()
                ->constrained('node_configs')
                ->nullOnDelete();
            $table->unsignedBigInteger('asset_id')
                ->nullable()
                ->comment('FK to assets table, reserved for future use');

            // Identity
            $table->string('name');
            $table->string('node_address', 10)
                ->comment('4-byte hex, unique per network');
            $table->string('service_id')->unique()
                ->comment('Serial or product key defined by your team');
            $table->string('product_type')->nullable();

            // Physical location
            $table->string('building_name')->nullable();
            $table->string('building_level')->nullable();
            $table->string('sector_name')->nullable();
            $table->string('postal_id')->nullable();

            // Status
            $table->boolean('is_online')->default(false);
            $table->timestamp('last_online_at')->nullable();
            $table->timestamp('provisioned_at')->nullable();
            $table->string('status')->default('new')
                ->comment('Enum: new|active|decommissioned');

            $table->timestamps();

            $table->unique(['network_id', 'node_address']);

            // Indexes for frequent queries
            $table->index('is_online');
            $table->index('last_online_at');
            $table->index('zone_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nodes');
    }
};
