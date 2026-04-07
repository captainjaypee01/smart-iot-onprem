<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gateways', function (Blueprint $table): void {
            $table->id();

            $table->unsignedBigInteger('network_id');
            $table->foreign('network_id')
                ->references('id')
                ->on('networks')
                ->restrictOnDelete();

            $table->string('gateway_id', 20)->unique();
            $table->string('sink_id', 2);
            $table->string('service_id', 100)->nullable();
            $table->string('asset_id', 100)->nullable();
            $table->string('device_key', 100)->nullable();
            $table->string('name', 255);
            $table->string('location', 255)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('gateway_version', 50)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_test_mode')->default(false);
            $table->timestamp('last_seen_at')->nullable();

            $table->softDeletes();
            $table->timestamps();

            // Indexes
            $table->index('network_id');
            $table->index('sink_id');
            $table->index('last_seen_at');
            $table->index('deleted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gateways');
    }
};
