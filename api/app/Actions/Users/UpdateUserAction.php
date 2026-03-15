<?php

declare(strict_types=1);

// app/Actions/Users/UpdateUserAction.php

namespace App\Actions\Users;

use App\DTO\Users\UpdateUserDTO;
use App\Models\User;
use Illuminate\Support\Arr;

class UpdateUserAction
{
    /**
     * Updates user fields from DTO. Returns the updated User.
     */
    public function execute(UpdateUserDTO $dto): User
    {
        $user = User::findOrFail($dto->userId);

        $data = array_filter([
            'first_name' => $dto->firstName,
            'last_name' => $dto->lastName,
            'email' => $dto->email,
            'username' => $dto->username,
            'role_id' => $dto->roleId,
            'company_id' => $dto->companyId,
            'status' => $dto->status,
        ], fn ($v) => $v !== null);

        if (Arr::has($data, 'first_name') || Arr::has($data, 'last_name')) {
            $firstName = $data['first_name'] ?? $user->first_name;
            $lastName = $data['last_name'] ?? $user->last_name;
            $data['name'] = trim($firstName . ' ' . $lastName);
        }

        if (Arr::has($data, 'email') && $data['email'] !== $user->email) {
            $data['email_verified_at'] = null;
        }

        if (Arr::has($data, 'status')) {
            $status = $data['status'];
            if ($status === 'active') {
                $data['is_active'] = true;
            } elseif (in_array($status, ['locked', 'disabled'], true)) {
                $data['is_active'] = false;
            }
        }

        $user->update($data);

        return $user;
    }
}
