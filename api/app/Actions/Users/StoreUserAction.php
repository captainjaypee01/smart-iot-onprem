<?php

declare(strict_types=1);

// app/Actions/Users/StoreUserAction.php

namespace App\Actions\Users;

use App\DTO\Users\StoreUserDTO;
use App\Models\User;
use App\Notifications\WelcomeUserNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class StoreUserAction
{
    /**
     * Creates user. When useInvite is true: password=null, invite token, WelcomeUserNotification.
     * When useInvite is false (superadmin-only): set password, email_verified_at, no invite.
     */
    public function execute(StoreUserDTO $dto): User
    {
        return DB::transaction(function () use ($dto): User {
            $name = trim($dto->firstName . ' ' . $dto->lastName);

            $password = $dto->useInvite ? null : ($dto->password !== null ? Hash::make($dto->password) : null);
            $emailVerifiedAt = ! $dto->useInvite ? now() : null;

            $user = User::create([
                'first_name' => $dto->firstName,
                'last_name' => $dto->lastName,
                'middle_name' => null,
                'name' => $name,
                'email' => $dto->email,
                'username' => $dto->username,
                'company_id' => $dto->companyId,
                'role_id' => $dto->roleId,
                'password' => $password,
                'is_active' => true,
                'email_verified_at' => $emailVerifiedAt,
            ]);

            if ($dto->useInvite) {
                $token = Str::random(64);
                DB::table('password_reset_tokens')->upsert(
                    [
                        'email' => $user->email,
                        'token' => $token,
                        'created_at' => now(),
                    ],
                    ['email'],
                    ['token', 'created_at']
                );
                $user->notify(new WelcomeUserNotification($token));
            }

            return $user;
        });
    }
}
