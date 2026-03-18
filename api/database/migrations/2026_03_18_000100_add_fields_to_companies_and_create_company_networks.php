<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('timezone', 100)
                ->default('UTC')
                ->after('code')
                ->comment('PHP timezone string e.g. Asia/Singapore');

            $table->string('logo_path')
                ->nullable()
                ->after('timezone')
                ->comment('Path on disk/S3. Served as signed URL.');

            $table->unsignedTinyInteger('login_attempts')
                ->default(5)
                ->after('logo_path')
                ->comment('Max failed login attempts before lockout. Range 1-10.');

            $table->boolean('is_2fa_enforced')
                ->default(false)
                ->after('login_attempts');

            $table->boolean('is_demo')
                ->default(false)
                ->after('is_2fa_enforced');

            $table->boolean('is_active_zone')
                ->default(true)
                ->after('is_demo');

            $table->unsignedSmallInteger('custom_alarm_threshold')
                ->nullable()
                ->after('is_active_zone')
                ->comment('Overrides network alarm_threshold. Null = use network default.');

            $table->string('custom_alarm_threshold_unit', 10)
                ->nullable()
                ->after('custom_alarm_threshold')
                ->comment('Allowed: minutes, hours. Null = use network default.');
        });

        Schema::create('company_networks', function (Blueprint $table) {
            $table->foreignId('company_id')
                ->constrained('companies')
                ->cascadeOnDelete();

            $table->foreignId('network_id')
                ->constrained('networks')
                ->cascadeOnDelete();

            $table->primary(['company_id', 'network_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_networks');

        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'timezone',
                'logo_path',
                'login_attempts',
                'is_2fa_enforced',
                'is_demo',
                'is_active_zone',
                'custom_alarm_threshold',
                'custom_alarm_threshold_unit',
            ]);
        });
    }
};

