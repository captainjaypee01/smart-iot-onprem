<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('networks', function (Blueprint $table): void {
            $table->string('gateway_prefix', 10)->nullable()->unique()->after('commissioned_date');
        });
    }

    public function down(): void
    {
        Schema::table('networks', function (Blueprint $table): void {
            $table->dropUnique(['gateway_prefix']);
            $table->dropColumn('gateway_prefix');
        });
    }
};
