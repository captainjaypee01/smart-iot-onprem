<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provisioning_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('network_id')->constrained()->restrictOnDelete();
            $table->string('packet_id', 8)->unique();
            $table->string('target_node_id', 10);
            $table->string('status')->default('pending');
            $table->unsignedTinyInteger('total_nodes');
            $table->unsignedTinyInteger('provisioned_nodes')->default(0);
            $table->boolean('is_auto_register')->default(false);
            $table->text('command_sent');
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provisioning_batches');
    }
};
