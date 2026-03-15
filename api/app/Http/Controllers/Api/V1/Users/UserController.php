<?php

declare(strict_types=1);

// app/Http/Controllers/Api/V1/Users/UserController.php
// CRUD controller for the User module — used by company admins and superadmin.

namespace App\Http\Controllers\Api\V1\Users;

use App\Actions\Users\DeleteUserAction;
use App\Actions\Users\StoreUserAction;
use App\Actions\Users\UpdateUserAction;
use App\DTO\Users\StoreUserDTO;
use App\DTO\Users\UpdateUserDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Users\StoreUserRequest;
use App\Http\Requests\Api\V1\Users\UpdateUserRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class UserController extends Controller
{
    /**
     * GET /api/v1/users
     * Superadmin: all users. Company admin: only users in their company.
     * Requires user.view permission or superadmin.
     */
    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->hasPermission('user.view')) {
            return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
        }

        $perPage = min(100, max(1, (int) $request->input('per_page', 15)));
        $users = User::query()
            ->with(['company', 'role'])
            ->when(! $authUser->is_superadmin, function ($query) use ($authUser) {
                $query->where('company_id', $authUser->company_id);
            })
            ->orderBy('name')
            ->paginate($perPage);

        return UserResource::collection($users);
    }

    /**
     * GET /api/v1/users/{user}
     * Company admin can only show users in their company.
     */
    public function show(Request $request, User $user): UserResource|JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->hasPermission('user.view')) {
            return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
        }
        if (! $authUser->is_superadmin && (int) $user->company_id !== (int) $authUser->company_id) {
            return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
        }

        $user->load(['company', 'role']);

        return new UserResource($user);
    }

    /**
     * POST /api/v1/users
     * Default: invite flow (password=null, token, WelcomeUserNotification).
     * Superadmin only: use_invite=false + password → create with password, no invite.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $useInvite = $request->boolean('use_invite', true);

        $dto = new StoreUserDTO(
            firstName: $request->validated('first_name'),
            lastName: $request->validated('last_name'),
            email: $request->validated('email'),
            username: $request->validated('username'),
            companyId: (int) $request->validated('company_id'),
            roleId: (int) $request->validated('role_id'),
            assignedBy: $request->user()->id,
            useInvite: $useInvite,
            password: $request->validated('password'),
        );

        $user = (new StoreUserAction)->execute($dto);
        $user->load(['company', 'role']);

        return response()->json(new UserResource($user), Response::HTTP_CREATED);
    }

    /**
     * PUT /api/v1/users/{user}
     */
    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        $dto = new UpdateUserDTO(
            userId: $user->id,
            firstName: $request->validated('first_name'),
            lastName: $request->validated('last_name'),
            email: $request->validated('email'),
            username: $request->validated('username'),
            roleId: $request->validated('role_id'),
            companyId: $request->validated('company_id'),
            status: $request->validated('status'),
            updatedBy: $request->user()->id,
        );

        $user = (new UpdateUserAction)->execute($dto);
        $user->load(['company', 'role']);

        return new UserResource($user);
    }

    /**
     * DELETE /api/v1/users/{user}
     * Soft delete. Cannot delete superadmin or self.
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->hasPermission('user.delete')) {
            return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
        }
        // Scope: company admin can only delete users in their company (skip for superadmin target so action returns specific message)
        if (! $user->is_superadmin && ! $authUser->is_superadmin && (int) $user->company_id !== (int) $authUser->company_id) {
            return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
        }

        $errorResponse = (new DeleteUserAction)->execute($user, $authUser->id);
        if ($errorResponse !== null) {
            return $errorResponse;
        }

        return response()->json(['message' => 'User deleted successfully.']);
    }
}
