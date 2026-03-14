<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings_new', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable()->constrained('companies')->nullOnDelete();
            $table->string('key');
            $table->text('value')->nullable();
            $table->timestamps();
            $table->primary(['company_id', 'key']);
        });

        DB::table('settings')->orderBy('key')->each(function ($row) {
            DB::table('settings_new')->insert([
                'company_id' => null,
                'key' => $row->key,
                'value' => $row->value,
                'created_at' => $row->created_at ?? now(),
                'updated_at' => $row->updated_at ?? now(),
            ]);
        });

        Schema::drop('settings');
        Schema::rename('settings_new', 'settings');
    }

    public function down(): void
    {
        Schema::create('settings_old', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        DB::table('settings')->whereNull('company_id')->orderBy('key')->each(function ($row) {
            DB::table('settings_old')->insert([
                'key' => $row->key,
                'value' => $row->value,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ]);
        });

        Schema::drop('settings');
        Schema::rename('settings_old', 'settings');
    }
};
