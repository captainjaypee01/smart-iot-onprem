<?php

// database/migrations/0001_01_01_000021_add_indexes.php
// Indexes for all currently existing tables.
//
// NOTE: Indexes for the following tables are intentionally excluded —
// their create migrations (000015–000019) do not exist yet:
//   - node_readings
//   - node_sensor_states
//   - alarm_readings
//   - fault_types
//   - faults
// Add their indexes here once those migrations are created.

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── companies ────────────────────────────────────────────────────────────
        Schema::table('companies', function (Blueprint $table) {
            $table->index('is_active', 'idx_companies_is_active');
        });

        // ── users ────────────────────────────────────────────────────────────────
        Schema::table('users', function (Blueprint $table) {
            $table->index('company_id', 'idx_users_company_id');
            $table->index('role_id', 'idx_users_role_id');
            $table->index('is_active', 'idx_users_is_active');
            $table->index(['company_id', 'is_active'], 'idx_users_company_active');
        });

        // ── social_accounts ──────────────────────────────────────────────────────
        Schema::table('social_accounts', function (Blueprint $table) {
            $table->index('user_id', 'idx_social_accounts_user_id');
            $table->index('token_expires_at', 'idx_social_accounts_token_expires');
        });

        // ── permissions ──────────────────────────────────────────────────────────
        Schema::table('permissions', function (Blueprint $table) {
            $table->index('module', 'idx_permissions_module');
        });

        // ── roles ────────────────────────────────────────────────────────────────
        Schema::table('roles', function (Blueprint $table) {
            $table->index('is_system_role', 'idx_roles_is_system_role');
        });

        // ── role_permissions ─────────────────────────────────────────────────────
        Schema::table('role_permissions', function (Blueprint $table) {
            $table->index('permission_id', 'idx_role_permissions_permission_id');
        });

        // ── role_companies ───────────────────────────────────────────────────────
        Schema::table('role_companies', function (Blueprint $table) {
            $table->index('company_id', 'idx_role_companies_company_id');
        });

        // ── role_networks ────────────────────────────────────────────────────────
        Schema::table('role_networks', function (Blueprint $table) {
            $table->index('network_id', 'idx_role_networks_network_id');
        });

        // ── networks ─────────────────────────────────────────────────────────────
        Schema::table('networks', function (Blueprint $table) {
            $table->index('is_active', 'idx_networks_is_active');
        });

        // ── zones ────────────────────────────────────────────────────────────────
        Schema::table('zones', function (Blueprint $table) {
            $table->index('network_id', 'idx_zones_network_id');
            $table->index(['network_id', 'is_active'], 'idx_zones_network_active');
        });

        // ── zone_managers ────────────────────────────────────────────────────────
        Schema::table('zone_managers', function (Blueprint $table) {
            $table->index('user_id', 'idx_zone_managers_user_id');
        });

        // ── node_configs ─────────────────────────────────────────────────────────
        Schema::table('node_configs', function (Blueprint $table) {
            $table->index('node_type_id', 'idx_node_configs_node_type_id');
        });

        // ── nodes ────────────────────────────────────────────────────────────────
        Schema::table('nodes', function (Blueprint $table) {
            $table->index('network_id', 'idx_nodes_network_id');
            $table->index('zone_id', 'idx_nodes_zone_id');
            $table->index('node_config_id', 'idx_nodes_node_config_id');
            $table->index('is_online', 'idx_nodes_is_online');
            $table->index('last_online_at', 'idx_nodes_last_online_at');
            $table->index(['network_id', 'is_online'], 'idx_nodes_network_online');
            $table->index(['zone_id', 'is_online'], 'idx_nodes_zone_online');
            $table->index(['network_id', 'zone_id'], 'idx_nodes_network_zone');
        });

        // ── activity_logs ────────────────────────────────────────────────────────
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index(['user_id', 'created_at'], 'idx_activity_logs_user_date');
            $table->index(['subject_type', 'subject_id'], 'idx_activity_logs_subject');
            $table->index(['company_id', 'created_at'], 'idx_activity_logs_company_date');
            $table->index('created_at', 'idx_activity_logs_created_at');
        });
    }

    public function down(): void
    {
        Schema::table('companies', fn ($t) => $t->dropIndex('idx_companies_is_active'));

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_company_id');
            $table->dropIndex('idx_users_role_id');
            $table->dropIndex('idx_users_is_active');
            $table->dropIndex('idx_users_company_active');
        });

        Schema::table('social_accounts', function (Blueprint $table) {
            $table->dropIndex('idx_social_accounts_user_id');
            $table->dropIndex('idx_social_accounts_token_expires');
        });

        Schema::table('permissions', fn ($t) => $t->dropIndex('idx_permissions_module'));
        Schema::table('roles', fn ($t) => $t->dropIndex('idx_roles_is_system_role'));
        Schema::table('role_permissions', fn ($t) => $t->dropIndex('idx_role_permissions_permission_id'));
        Schema::table('role_companies', fn ($t) => $t->dropIndex('idx_role_companies_company_id'));
        Schema::table('role_networks', fn ($t) => $t->dropIndex('idx_role_networks_network_id'));
        Schema::table('networks', fn ($t) => $t->dropIndex('idx_networks_is_active'));

        Schema::table('zones', function (Blueprint $table) {
            $table->dropIndex('idx_zones_network_id');
            $table->dropIndex('idx_zones_network_active');
        });

        Schema::table('zone_managers', fn ($t) => $t->dropIndex('idx_zone_managers_user_id'));
        Schema::table('node_configs', fn ($t) => $t->dropIndex('idx_node_configs_node_type_id'));

        Schema::table('nodes', function (Blueprint $table) {
            $table->dropIndex('idx_nodes_network_id');
            $table->dropIndex('idx_nodes_zone_id');
            $table->dropIndex('idx_nodes_node_config_id');
            $table->dropIndex('idx_nodes_is_online');
            $table->dropIndex('idx_nodes_last_online_at');
            $table->dropIndex('idx_nodes_network_online');
            $table->dropIndex('idx_nodes_zone_online');
            $table->dropIndex('idx_nodes_network_zone');
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex('idx_activity_logs_user_date');
            $table->dropIndex('idx_activity_logs_subject');
            $table->dropIndex('idx_activity_logs_company_date');
            $table->dropIndex('idx_activity_logs_created_at');
        });
    }
};
