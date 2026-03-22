<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('features', function (Blueprint $table): void {
            $table->id();

            $table->string('key', 50)->unique()
                ->comment('Route slug e.g. dashboard, fire-extinguisher');

            $table->string('name', 100);

            $table->string('group', 50)->default('general')
                ->comment('Sidebar section: monitoring, reports, management, admin');

            $table->unsignedSmallInteger('group_order')->default(0)
                ->comment('Order of the GROUP in sidebar. Shared by all features in
the same group. Only updated via PUT /features/reorder-groups.');

            $table->string('route', 100)
                ->comment('Frontend route path e.g. /dashboard');

            $table->string('icon', 50)->nullable()
                ->comment('Lucide-react icon name e.g. LayoutDashboard');

            $table->unsignedSmallInteger('sort_order')->default(0)
                ->comment('Order of this feature WITHIN its group');

            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });

        Schema::create('role_features', function (Blueprint $table): void {
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->foreignId('feature_id')->constrained('features')->cascadeOnDelete();

            $table->primary(['role_id', 'feature_id']);
        });
    }

    public function down(): void
    {
        // Drop pivot first (FK constraints), then the parent table.
        Schema::dropIfExists('role_features');
        Schema::dropIfExists('features');
    }
};

