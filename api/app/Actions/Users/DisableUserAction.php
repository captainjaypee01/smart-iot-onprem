<?php

declare(strict_types=1);

// app/Actions/Users/DisableUserAction.php

namespace App\Actions\Users;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class DisableUserAction
{
    /**
     * Toggles user is_active. Enforces: cannot disable superadmin, cannot disable self.
     * Returns JsonResponse with error on violation, or the updated User on success.
     */
    public function execute(User $user, int $actorId): User|JsonResponse
    {
        if ($user->is_superadmin) {
            return response()->json([
                'message' => 'Superadmin accounts cannot be disabled.',
            ], Response::HTTP_FORBIDDEN);
        }

        if ($user->id === $actorId) {
            return response()->json([
                'message' => 'You cannot disable your own account.',
            ], Response::HTTP_FORBIDDEN);
        }

        $user->update(['is_active' => ! $user->is_active]);

        return $user;
    }
}
