<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('networks', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('network_address', 10)->unique()
                ->comment('3-byte hex, uppercase, no prefix e.g. A3F2B1');
            $table->text('description')->nullable();
            $table->text('remarks')->nullable();
            $table->boolean('is_active')->default(true);

            $table->unsignedTinyInteger('diagnostic_interval')
                ->default(30)
                ->comment('Minutes between diagnostic messages. Allowed: 5, 10, 30');

            $table->unsignedSmallInteger('alarm_threshold')
                ->default(5)
                ->comment('Numeric value of alarm debounce threshold');
            $table->string('alarm_threshold_unit', 10)
                ->default('minutes')
                ->comment('Unit for alarm_threshold. Allowed: minutes, hours');

            $table->string('wirepas_version', 10)->nullable()
                ->comment('Fixed list: 5.2, 5.1, 5.0, 4.0');

            $table->date('commissioned_date')->nullable()
                ->comment('Data before this date is not shown to customers.');

            $table->boolean('is_maintenance')->default(false);
            $table->timestamp('maintenance_start_at')->nullable();
            $table->timestamp('maintenance_end_at')->nullable();

            $table->boolean('has_monthly_report')->default(false);

            $table->timestamps();
        });

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
        Schema::dropIfExists('networks');
    }
};

