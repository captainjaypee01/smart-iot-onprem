<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('node_sensor_states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('node_id')
                ->unique()
                ->constrained('nodes')
                ->cascadeOnDelete();

            // Latest known value per sensor slot
            // Each sensor tracks its own last-updated timestamp
            // so you know exactly when each sensor was last seen
            $table->string('sensor_1_hex')->nullable();
            $table->string('sensor_1_value')->nullable();
            $table->timestamp('sensor_1_updated_at')->nullable();

            $table->string('sensor_2_hex')->nullable();
            $table->string('sensor_2_value')->nullable();
            $table->timestamp('sensor_2_updated_at')->nullable();

            $table->string('sensor_3_hex')->nullable();
            $table->string('sensor_3_value')->nullable();
            $table->timestamp('sensor_3_updated_at')->nullable();

            $table->string('sensor_4_hex')->nullable();
            $table->string('sensor_4_value')->nullable();
            $table->timestamp('sensor_4_updated_at')->nullable();

            $table->string('sensor_5_hex')->nullable();
            $table->string('sensor_5_value')->nullable();
            $table->timestamp('sensor_5_updated_at')->nullable();

            $table->string('sensor_6_hex')->nullable();
            $table->string('sensor_6_value')->nullable();
            $table->timestamp('sensor_6_updated_at')->nullable();

            $table->string('sensor_7_hex')->nullable();
            $table->string('sensor_7_value')->nullable();
            $table->timestamp('sensor_7_updated_at')->nullable();

            $table->string('sensor_8_hex')->nullable();
            $table->string('sensor_8_value')->nullable();
            $table->timestamp('sensor_8_updated_at')->nullable();

            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('node_sensor_states');
    }
};
