<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provisioning_batch_nodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provisioning_batch_id')->constrained()->cascadeOnDelete();
            $table->string('service_id');
            $table->string('node_address', 10);
            $table->string('status')->default('pending');
            $table->ulid('last_command_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provisioning_batch_nodes');
    }
};
