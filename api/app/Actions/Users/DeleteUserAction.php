<?php

declare(strict_types=1);

// app/Actions/Users/DeleteUserAction.php

namespace App\Actions\Users;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class DeleteUserAction
{
    /**
     * Soft-deletes the user. Enforces: cannot delete superadmin, cannot delete self.
     * Returns JsonResponse with error on violation, or null on success.
     */
    public function execute(User $user, int $actorId): ?JsonResponse
    {
        if ($user->is_superadmin) {
            return response()->json([
                'message' => 'Superadmin accounts cannot be deleted.',
            ], Response::HTTP_FORBIDDEN);
        }

        if ($user->id === $actorId) {
            return response()->json([
                'message' => 'You cannot delete your own account.',
            ], Response::HTTP_FORBIDDEN);
        }

        $user->delete();

        return null;
    }
}
