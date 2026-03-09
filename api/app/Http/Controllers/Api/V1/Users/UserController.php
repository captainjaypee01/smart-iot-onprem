<?php

// app/Http/Controllers/Api/V1/Users/UserController.php
// CRUD controller for the User module — used by company admins and superadmin

namespace App\Http\Controllers\Api\V1\Users;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Users\StoreUserRequest;
use App\Http\Requests\Api\V1\Users\UpdateUserRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use App\Notifications\WelcomeUserNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UserController extends Controller
{
    // GET /api/v1/users
    // Superadmin sees all users. Company admin sees only their company's users.
    public function index(Request $request): AnonymousResourceCollection
    {
        $authUser = $request->user();

        $users = User::query()
            ->with(['company', 'userRole.role.permissions'])
            ->when(! $authUser->is_superadmin, function ($query) use ($authUser) {
                $query->where('company_id', $authUser->company_id);
            })
            ->orderBy('name')
            ->paginate(25);

        return UserResource::collection($users);
    }

    // GET /api/v1/users/{user}
    public function show(User $user): UserResource
    {
        $user->load(['company', 'userRole.role.permissions']);

        return new UserResource($user);
    }

    // POST /api/v1/users
    // Creates the user, assigns a role, and sends the welcome/invite email
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request): User {
            $user = User::create([
                'company_id' => $request->company_id,
                'name'       => $request->name,
                'email'      => $request->email,
                'password'   => null, // Set by the user via the welcome email link
                'is_active'  => true,
            ]);

            $user->userRole()->create([
                'role_id'     => $request->role_id,
                'assigned_by' => $request->user()->id,
            ]);

            $token = Str::random(64);

            DB::table('password_reset_tokens')->upsert(
                ['email' => $user->email, 'token' => $token, 'created_at' => now()],
                ['email'],
                ['token', 'created_at']
            );

            $user->notify(new WelcomeUserNotification($token));

            return $user;
        });

        $user->load(['company', 'userRole.role.permissions']);

        return response()->json(new UserResource($user), 201);
    }

    // PUT /api/v1/users/{user}
    // Updates name, email, and/or role. Email change also resets email_verified_at.
    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        DB::transaction(function () use ($request, $user): void {
            $user->update(
                collect($request->only(['name', 'email']))
                    ->when(
                        $request->has('email') && $request->email !== $user->email,
                        fn ($data) => $data->put('email_verified_at', null)
                    )
                    ->toArray()
            );

            // Update role if provided — userRole is guaranteed to exist (one per user)
            if ($request->has('role_id')) {
                $user->userRole()->update([
                    'role_id'     => $request->role_id,
                    'assigned_by' => $request->user()->id,
                ]);
            }
        });

        $user->load(['company', 'userRole.role.permissions']);

        return new UserResource($user);
    }

    // DELETE /api/v1/users/{user}
    // Hard deletes the user. Consider soft deletes if you need audit history.
    // A superadmin cannot be deleted via this endpoint.
    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->is_superadmin) {
            return response()->json([
                'message' => 'Superadmin accounts cannot be deleted.',
            ], 403);
        }

        // Prevent self-deletion
        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'You cannot delete your own account.',
            ], 403);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }
}