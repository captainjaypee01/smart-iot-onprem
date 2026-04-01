<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('commands', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('network_id')->unsigned()->constrained('networks');
            $table->string('device_id')->nullable();
            $table->string('type');
            $table->text('payload')->nullable();
            $table->string('status')->default('pending');
            $table->string('correlation_id')->unique();
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamp('acked_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->string('error_code')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('correlation_id');
            $table->index('created_at');
            $table->index(['user_id', 'status']);
            $table->index('network_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commands');
    }
};
