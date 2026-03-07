<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('node_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('node_type_id')
                ->constrained('node_types')
                ->restrictOnDelete();
            $table->string('name')->comment('e.g. Standard FE, High-Pressure FE');

            // Sensor definitions — name and unit per sensor slot
            $table->string('sensor_1_name')->nullable();
            $table->string('sensor_1_unit')->nullable();
            $table->string('sensor_2_name')->nullable();
            $table->string('sensor_2_unit')->nullable();
            $table->string('sensor_3_name')->nullable();
            $table->string('sensor_3_unit')->nullable();
            $table->string('sensor_4_name')->nullable();
            $table->string('sensor_4_unit')->nullable();
            $table->string('sensor_5_name')->nullable();
            $table->string('sensor_5_unit')->nullable();
            $table->string('sensor_6_name')->nullable();
            $table->string('sensor_6_unit')->nullable();
            $table->string('sensor_7_name')->nullable();
            $table->string('sensor_7_unit')->nullable();
            $table->string('sensor_8_name')->nullable();
            $table->string('sensor_8_unit')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('node_configs');
    }
};
