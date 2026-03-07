<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('action')
                ->comment('e.g. viewed_fault, verified_fault, assigned_user_to_zone');
            $table->string('subject_type')->nullable()
                ->comment('Morph type e.g. Fault, Node, Zone');
            $table->unsignedBigInteger('subject_id')->nullable()
                ->comment('ID of the subject record');
            $table->foreignId('company_id')
                ->nullable()
                ->constrained('companies')
                ->nullOnDelete()
                ->comment('Which company data was touched — audit context');
            $table->string('ip_address', 45)->nullable();
            $table->json('payload')->nullable()
                ->comment('Any extra context as JSON');
            $table->timestamp('created_at')->useCurrent();

            // Indexes for audit queries
            $table->index(['subject_type', 'subject_id']);
            $table->index(['user_id', 'created_at']);
            $table->index('company_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
