<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('node_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->comment('e.g. Fire Extinguisher, Smoke Detector');
            $table->string('area_id', 10)->unique()
                ->comment('4-byte hex identifier at mesh level');
            $table->text('description')->nullable();
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
        Schema::dropIfExists('node_types');
    }
};
