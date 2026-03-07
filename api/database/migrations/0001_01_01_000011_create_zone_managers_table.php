<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zone_managers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('zone_id')
                ->constrained('zones')
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->foreignId('assigned_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();

            $table->unique(['zone_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('zone_managers');
    }
};
