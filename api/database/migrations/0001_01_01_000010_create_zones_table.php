<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('network_id')
                ->constrained('networks')
                ->cascadeOnDelete();
            $table->string('name');
            $table->string('group_address', 10)
                ->comment('4-byte hex, unique per network e.g. 0x00000001');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['network_id', 'group_address']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('zones');
    }
};
