<?php

// app/Console/Commands/CreateUser.php
// Interactive Artisan command for creating users on the server.
//
// Usage:
//   php artisan user:create
//
// Intended for:
//   - First deploy: creating the superadmin account
//   - Recovery: creating a new admin when locked out of the dashboard
//
// Password is collected via hidden terminal input — never written to any
// file, env variable, log, or command history.

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateUser extends Command
{
    protected $signature = 'user:create';

    protected $description = 'Interactively create a new user (superadmin or regular)';

    public function handle(): int
    {
        $this->newLine();
        $this->components->info('Create a new user');
        $this->newLine();

        // ── Step 1: Account type ──────────────────────────────────────────────
        $isSuperAdmin = $this->components->confirm(
            'Is this a superadmin account?',
            false
        );

        // ── Step 2: Name ──────────────────────────────────────────────────────
        $firstName = $this->askValid(
            question: 'First name',
            rules: ['required', 'string', 'max:255'],
        );

        $middleName = $this->askValid(
            question: 'Middle name (optional)',
            rules: ['nullable', 'max:255', 'nullable'],
        );

        $lastName = $this->askValid(
            question: 'Last name',
            rules: ['required', 'string', 'max:255'],
        );

        $fullName = trim($firstName.' '.$lastName);

        // ── Step 3: Email ─────────────────────────────────────────────────────
        $email = $this->askValid(
            question: 'Email address',
            rules: ['required', 'email', 'unique:users,email'],
            messages: ['unique' => 'A user with this email already exists.'],
        );

        // ── Step 4: Password (hidden) ─────────────────────────────────────────
        $password = $this->askPassword();

        // ── Step 5: Company (skipped for superadmin) ──────────────────────────
        $companyId = null;

        if (! $isSuperAdmin) {
            $companies = Company::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code']);

            if ($companies->isEmpty()) {
                $this->components->error('No active companies found. Create a company first.');

                return self::FAILURE;
            }

            $companyChoice = $this->components->choice(
                'Company',
                $companies->map(fn ($c) => "{$c->name} ({$c->code})")->toArray(),
            );

            $companyId = $companies->firstWhere(
                fn ($c) => "{$c->name} ({$c->code})" === $companyChoice
            )->id;
        }

        // ── Step 6: Role (skipped for superadmin) ─────────────────────────────
        $roleId = null;

        if (! $isSuperAdmin) {
            $roles = Role::orderBy('name')->get(['id', 'name', 'is_system_role']);

            if ($roles->isEmpty()) {
                $this->components->error('No roles found. Run db:seed first.');

                return self::FAILURE;
            }

            $roleChoice = $this->components->choice(
                'Role',
                $roles->map(fn ($r) => $r->name)->toArray(),
            );

            $roleId = $roles->firstWhere('name', $roleChoice)->id;
        }

        // ── Step 7: Confirm before creating ───────────────────────────────────
        $this->newLine();
        $this->components->twoColumnDetail('Name', $fullName);
        $this->components->twoColumnDetail('Email', $email);
        $this->components->twoColumnDetail('SuperAdmin', $isSuperAdmin ? 'Yes' : 'No');

        if (! $isSuperAdmin) {
            $company = Company::find($companyId);
            $role = Role::find($roleId);
            $this->components->twoColumnDetail('Company', "{$company->name} ({$company->code})");
            $this->components->twoColumnDetail('Role', $role->name);
        }

        $this->newLine();

        if (! $this->components->confirm('Create this user?', true)) {
            $this->components->warn('Cancelled. No user was created.');

            return self::SUCCESS;
        }

        // ── Step 8: Create ────────────────────────────────────────────────────
        $user = User::create([
            'first_name' => $firstName,
            'middle_name' => $middleName ?: null,
            'last_name' => $lastName,
            'name' => $fullName,
            'email' => $email,
            'company_id' => $companyId,
            'role_id' => $roleId,
            'password' => Hash::make($password),
            'is_superadmin' => $isSuperAdmin,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $this->newLine();
        $this->components->success("User [{$user->email}] created successfully.");

        // Remind operator to share credentials securely — never log the password
        if ($isSuperAdmin) {
            $this->components->warn(
                'Share the password with the account owner via a secure channel (not email or chat).'
            );
        } else {
            $this->components->info(
                'You can send an invite link from the dashboard so the user sets their own password.'
            );
        }

        $this->newLine();

        return self::SUCCESS;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Ask a question and re-prompt until the answer passes validation.
     *
     * @param  array<string>  $rules
     * @param  array<string>  $messages
     */
    private function askValid(
        string $question,
        array $rules,
        array $messages = [],
    ): string {
        while (true) {
            $answer = $this->components->ask($question);

            // Symfony's ask() may return null if the user just presses Enter.
            // Normalize to an empty string so validation (including "nullable") works
            // and we always satisfy the string return type.
            if ($answer === null) {
                $answer = '';
            }

            $validator = Validator::make(
                ['value' => $answer],
                ['value' => $rules],
                collect($messages)
                    ->mapWithKeys(fn ($msg, $rule) => ["value.{$rule}" => $msg])
                    ->all(),
            );

            if (! $validator->fails()) {
                return $answer;
            }

            foreach ($validator->errors()->get('value') as $error) {
                $this->components->error($error);
            }
        }
    }

    /**
     * Prompt for a password twice (hidden), enforce min 8 chars, confirm match.
     */
    private function askPassword(): string
    {
        while (true) {
            $password = $this->secret('Password (min 8 characters, input hidden)');

            if (strlen($password) < 8) {
                $this->components->error('Password must be at least 8 characters.');

                continue;
            }

            $confirm = $this->secret('Confirm password');

            if ($password !== $confirm) {
                $this->components->error('Passwords do not match. Please try again.');

                continue;
            }

            return $password;
        }
    }
}
