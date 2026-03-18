<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('network_node_types', function (Blueprint $table) {
            $table->foreignId('network_id')
                ->constrained('networks')
                ->cascadeOnDelete();

            $table->foreignId('node_type_id')
                ->constrained('node_types')
                ->cascadeOnDelete();

            $table->primary(['network_id', 'node_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('network_node_types');
    }
};
