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
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('node_types');
    }
};
