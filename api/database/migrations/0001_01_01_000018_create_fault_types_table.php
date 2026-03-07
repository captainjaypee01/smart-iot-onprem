<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fault_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('node_config_id')
                ->constrained('node_configs')
                ->restrictOnDelete();
            $table->string('code')->comment('Your internal fault identifier');
            $table->string('name');
            $table->text('default_description')->nullable();
            $table->string('severity')->default('warning')
                ->comment('critical | warning | info');
            $table->timestamps();

            $table->unique(['node_config_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fault_types');
    }
};
