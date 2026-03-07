<?php

// database/migrations/0001_01_01_000021_add_indexes.php
// Comprehensive indexes across all tables — based on expected query patterns

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── companies ────────────────────────────────────────────────────────────
        // Filter active companies in listings
        Schema::table('companies', function (Blueprint $table) {
            $table->index('is_active', 'idx_companies_is_active');
        });

        // ── users ────────────────────────────────────────────────────────────────
        // Filter users by company (company admin managing their users)
        // Filter by active status
        // Combined: company + active (most common listing query)
        Schema::table('users', function (Blueprint $table) {
            $table->index('company_id',               'idx_users_company_id');
            $table->index('is_active',                'idx_users_is_active');
            $table->index(['company_id', 'is_active'], 'idx_users_company_active');
        });

        // ── social_accounts ──────────────────────────────────────────────────────
        // Look up SSO account by user (e.g. refresh token)
        Schema::table('social_accounts', function (Blueprint $table) {
            $table->index('user_id',               'idx_social_accounts_user_id');
            $table->index('token_expires_at',      'idx_social_accounts_token_expires');
        });

        // ── permissions ──────────────────────────────────────────────────────────
        // Group permissions by module for role management UI
        Schema::table('permissions', function (Blueprint $table) {
            $table->index('module', 'idx_permissions_module');
        });

        // ── roles ────────────────────────────────────────────────────────────────
        // Filter system roles vs custom roles
        Schema::table('roles', function (Blueprint $table) {
            $table->index('is_system_role', 'idx_roles_is_system_role');
        });

        // ── role_permissions ─────────────────────────────────────────────────────
        // Reverse lookup: which roles have a given permission
        Schema::table('role_permissions', function (Blueprint $table) {
            $table->index('permission_id', 'idx_role_permissions_permission_id');
        });

        // ── role_companies ───────────────────────────────────────────────────────
        // Which roles are available to a company (company admin role assignment UI)
        Schema::table('role_companies', function (Blueprint $table) {
            $table->index('company_id', 'idx_role_companies_company_id');
        });

        // ── role_networks ────────────────────────────────────────────────────────
        // Which roles can access a given network (access check)
        Schema::table('role_networks', function (Blueprint $table) {
            $table->index('network_id', 'idx_role_networks_network_id');
        });

        // ── user_roles ───────────────────────────────────────────────────────────
        // Reverse lookup: all users assigned to a given role
        Schema::table('user_roles', function (Blueprint $table) {
            $table->index('role_id',      'idx_user_roles_role_id');
            $table->index('assigned_by',  'idx_user_roles_assigned_by');
        });

        // ── networks ─────────────────────────────────────────────────────────────
        // Filter active networks
        Schema::table('networks', function (Blueprint $table) {
            $table->index('is_active', 'idx_networks_is_active');
        });

        // ── zones ────────────────────────────────────────────────────────────────
        // All zones in a network (zone listing page)
        // Filter active zones within a network
        Schema::table('zones', function (Blueprint $table) {
            $table->index('network_id',                  'idx_zones_network_id');
            $table->index(['network_id', 'is_active'],   'idx_zones_network_active');
        });

        // ── zone_managers ────────────────────────────────────────────────────────
        // All zones a user manages (user profile / access check)
        Schema::table('zone_managers', function (Blueprint $table) {
            $table->index('user_id', 'idx_zone_managers_user_id');
        });

        // ── node_types ───────────────────────────────────────────────────────────
        // Look up node type by area_id (already UNIQUE but named index helps clarity)
        // No additional indexes needed — area_id unique covers lookup

        // ── node_configs ─────────────────────────────────────────────────────────
        // All configs for a node type (config management UI)
        Schema::table('node_configs', function (Blueprint $table) {
            $table->index('node_type_id', 'idx_node_configs_node_type_id');
        });

        // ── nodes ────────────────────────────────────────────────────────────────
        // These are the most critical indexes — nodes table will be queried constantly
        //
        // network_id              → list all nodes in a network
        // zone_id                 → list all nodes in a zone
        // node_config_id          → filter by node type/config
        // is_online               → find all offline nodes
        // last_online_at          → threshold check for offline detection
        // (network_id, is_online) → offline nodes within a specific network
        // (zone_id, is_online)    → offline nodes within a specific zone
        // (network_id, zone_id)   → nodes filtered by both (common dashboard query)
        Schema::table('nodes', function (Blueprint $table) {
            $table->index('network_id',                       'idx_nodes_network_id');
            $table->index('zone_id',                          'idx_nodes_zone_id');
            $table->index('node_config_id',                   'idx_nodes_node_config_id');
            $table->index('is_online',                        'idx_nodes_is_online');
            $table->index('last_online_at',                   'idx_nodes_last_online_at');
            $table->index(['network_id', 'is_online'],        'idx_nodes_network_online');
            $table->index(['zone_id', 'is_online'],           'idx_nodes_zone_online');
            $table->index(['network_id', 'zone_id'],          'idx_nodes_network_zone');
        });

        // ── node_readings ────────────────────────────────────────────────────────
        // This will be the largest table in the system.
        //
        // (node_id, received_at DESC) → latest readings for a node (most common)
        // (node_id, received_at)      → readings in a time range for a node
        //
        // NOTE: Consider partitioning this table by month in production
        // once data volume grows (e.g. pg_partman for Postgres).
        Schema::table('node_readings', function (Blueprint $table) {
            // Primary lookup: readings for a specific node in a time range
            $table->index(['node_id', 'received_at'], 'idx_node_readings_node_received');
            // Covers queries that filter by received_at only (e.g. bulk reports)
            $table->index(['received_at'], 'idx_node_readings_received_at');
        });

        // ── node_sensor_states ───────────────────────────────────────────────────
        // node_id is already UNIQUE — no additional indexes needed.
        // The unique constraint acts as the primary lookup index.

        // ── alarm_readings ───────────────────────────────────────────────────────
        // Same pattern as node_readings
        Schema::table('alarm_readings', function (Blueprint $table) {
            // Primary lookup: readings for a specific node in a time range
            $table->index(['node_id', 'received_at'], 'idx_alarm_readings_node_received');
            // Covers bulk report queries by date range only
            $table->index(['received_at'], 'idx_alarm_readings_received_at');
        });

        // ── fault_types ──────────────────────────────────────────────────────────
        // Filter fault types by severity (dashboard KPI counts)
        // Filter by node config (fault type management)
        Schema::table('fault_types', function (Blueprint $table) {
            $table->index('node_config_id',  'idx_fault_types_node_config_id');
            $table->index('severity',        'idx_fault_types_severity');
        });

        // ── faults ───────────────────────────────────────────────────────────────
        // This table drives most of your dashboard KPIs and listings.
        //
        // (node_id, is_resolved)                  → outstanding faults per node
        // (node_id, fault_date)                   → faults over time per node
        // (is_resolved, verified_at)              → faults pending verification
        // (is_resolved, investigation_started_at) → faults pending investigation
        // (is_resolved, fault_cleared_at)         → cleared but unresolved faults
        // fault_type_id                           → filter by fault type / severity join
        // fault_date                              → date range queries across all nodes
        // (is_resolved, fault_date)               → outstanding faults in a date range
        Schema::table('faults', function (Blueprint $table) {
            $table->index(['node_id', 'is_resolved'],                   'idx_faults_node_resolved');
            $table->index(['node_id', 'fault_date'],                    'idx_faults_node_date');
            $table->index(['is_resolved', 'verified_at'],               'idx_faults_resolved_verified');
            $table->index(['is_resolved', 'investigation_started_at'],  'idx_faults_resolved_investigation');
            $table->index(['is_resolved', 'fault_cleared_at'],          'idx_faults_resolved_cleared');
            $table->index('fault_type_id',                              'idx_faults_fault_type_id');
            $table->index('fault_date',                                 'idx_faults_fault_date');
            $table->index(['is_resolved', 'fault_date'],                'idx_faults_resolved_date');
        });

        // ── activity_logs ────────────────────────────────────────────────────────
        // Audit trail queries:
        // (user_id, created_at)          → all actions by a user over time
        // (subject_type, subject_id)     → full history of a specific record
        // (company_id, created_at)       → all actions touching a company's data
        // created_at                     → global audit log sorted by time
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index(['user_id', 'created_at'],          'idx_activity_logs_user_date');
            $table->index(['subject_type', 'subject_id'],     'idx_activity_logs_subject');
            $table->index(['company_id', 'created_at'],       'idx_activity_logs_company_date');
            $table->index('created_at',                       'idx_activity_logs_created_at');
        });
    }

    public function down(): void
    {
        Schema::table('companies',        fn($t) => $t->dropIndex('idx_companies_is_active'));

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_company_id');
            $table->dropIndex('idx_users_is_active');
            $table->dropIndex('idx_users_company_active');
        });

        Schema::table('social_accounts', function (Blueprint $table) {
            $table->dropIndex('idx_social_accounts_user_id');
            $table->dropIndex('idx_social_accounts_token_expires');
        });

        Schema::table('permissions',      fn($t) => $t->dropIndex('idx_permissions_module'));
        Schema::table('roles',            fn($t) => $t->dropIndex('idx_roles_is_system_role'));
        Schema::table('role_permissions', fn($t) => $t->dropIndex('idx_role_permissions_permission_id'));
        Schema::table('role_companies',   fn($t) => $t->dropIndex('idx_role_companies_company_id'));
        Schema::table('role_networks',    fn($t) => $t->dropIndex('idx_role_networks_network_id'));

        Schema::table('user_roles', function (Blueprint $table) {
            $table->dropIndex('idx_user_roles_role_id');
            $table->dropIndex('idx_user_roles_assigned_by');
        });

        Schema::table('networks',         fn($t) => $t->dropIndex('idx_networks_is_active'));

        Schema::table('zones', function (Blueprint $table) {
            $table->dropIndex('idx_zones_network_id');
            $table->dropIndex('idx_zones_network_active');
        });

        Schema::table('zone_managers',    fn($t) => $t->dropIndex('idx_zone_managers_user_id'));
        Schema::table('node_configs',     fn($t) => $t->dropIndex('idx_node_configs_node_type_id'));

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

        Schema::table('node_readings',    fn($t) => $t->dropIndex('idx_node_readings_node_received'));
        Schema::table('alarm_readings',   fn($t) => $t->dropIndex('idx_alarm_readings_node_received'));

        Schema::table('fault_types', function (Blueprint $table) {
            $table->dropIndex('idx_fault_types_node_config_id');
            $table->dropIndex('idx_fault_types_severity');
        });

        Schema::table('faults', function (Blueprint $table) {
            $table->dropIndex('idx_faults_node_resolved');
            $table->dropIndex('idx_faults_node_date');
            $table->dropIndex('idx_faults_resolved_verified');
            $table->dropIndex('idx_faults_resolved_investigation');
            $table->dropIndex('idx_faults_resolved_cleared');
            $table->dropIndex('idx_faults_fault_type_id');
            $table->dropIndex('idx_faults_fault_date');
            $table->dropIndex('idx_faults_resolved_date');
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex('idx_activity_logs_user_date');
            $table->dropIndex('idx_activity_logs_subject');
            $table->dropIndex('idx_activity_logs_company_date');
            $table->dropIndex('idx_activity_logs_created_at');
        });
    }
};
