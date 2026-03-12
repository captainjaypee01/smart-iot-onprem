# API Development Guidelines

This document outlines the coding standards, architecture patterns, and best practices for the Smart IoT On-Prem API.

## Folder Structure

```
app/
├── Actions/              # Use-case classes (business logic)
│   ├── Commands/         # Command-related actions
│   └── Auth/             # Authentication actions
├── Contracts/            # Interfaces for dependency injection
├── DTO/                  # Data Transfer Objects (immutable input/output)
│   └── Commands/         # Command-related DTOs
├── Enums/                # Type-safe enumerations
├── Services/             # Service classes (e.g., OutboxPublisherService)
├── Notifications/        # Laravel notification classes (e.g., WelcomeUserNotification)
├── Http/
│   ├── Controllers/
│   │   ├── Api/V1/       # Public API controllers (SPA)
│   │   │   ├── Auth/     # Auth controllers (Login, Logout, Me, MicrosoftRedirect, SetPassword)
│   │   │   └── Users/    # User controllers (UserController, ResendInviteController, DisableUserController)
│   │   ├── Auth/         # Web-route controllers (MicrosoftCallbackController)
│   │   └── Internal/     # Internal API controllers (backend services)
│   ├── Middleware/       # Custom middleware
│   ├── Requests/
│   │   └── Api/V1/       # FormRequest validation classes
│   └── Resources/
│       └── Api/V1/       # JSON API resources
├── Models/               # Eloquent models
└── Policies/             # Authorization policies

routes/
├── api.php               # Public API routes (/api/v1/*)
├── web.php               # Browser-facing routes (Microsoft OAuth callback)
└── internal.php          # Internal API routes (/internal/*)
```

---

## Controller Patterns

### Single-Action Controllers (`__invoke`)

Use for routes that do **one isolated thing** and don't share logic with sibling routes.
This is the preferred pattern for auth routes and one-off state-change actions.

```php
// ✅ Use __invoke for isolated actions
class LoginController extends Controller
{
    public function __invoke(LoginRequest $request): JsonResponse { ... }
}

// Route registration is clean — no method name needed
Route::post('/auth/login', LoginController::class);
```

**Use `__invoke` for:**
- All auth controllers (Login, Logout, Me, MicrosoftRedirect, SetPassword, MicrosoftCallback)
- One-off user actions: `ResendInviteController`, `DisableUserController`
- Any action that doesn't belong in a standard CRUD flow

### Resource Controllers (Named Methods)

Use for modules with standard CRUD operations. Register with `Route::apiResource`.

```php
// ✅ Use named methods for CRUD modules
class UserController extends Controller
{
    public function index(): AnonymousResourceCollection { ... }   // GET    /users
    public function show(User $user): UserResource { ... }         // GET    /users/{user}
    public function store(StoreUserRequest $request): JsonResponse { ... } // POST   /users
    public function update(UpdateUserRequest $request, User $user): UserResource { ... } // PUT /users/{user}
    public function destroy(Request $request, User $user): JsonResponse { ... } // DELETE /users/{user}
}

// One line registers all 5 routes
Route::apiResource('users', UserController::class);

// One-off actions that don't fit CRUD get their own single-action controllers
Route::post('/users/{user}/resend-invite', ResendInviteController::class);
Route::post('/users/{user}/disable', DisableUserController::class);
```

**Use resource controllers for:** `UserController`, `CompanyController`, `NetworkController`, `RoleController`, and any future CRUD modules.

---

## Adding a New Endpoint

### 1. Create FormRequest (if needed)

```php
<?php
// app/Http/Requests/Api/V1/Users/StoreUserRequest.php
namespace App\Http\Requests\Api\V1\Users;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Or use policies
    }

    public function rules(): array
    {
        return [
            'name'       => ['required', 'string', 'max:255'],
            'email'      => ['required', 'email', 'unique:users,email'],
            'company_id' => ['required', 'integer', 'exists:companies,id'],
            'role_id'    => ['required', 'integer', 'exists:roles,id'],
        ];
    }
}
```

### 2. Create DTO (if complex input)

```php
<?php
// app/DTO/Users/StoreUserDTO.php
namespace App\DTO\Users;

readonly class StoreUserDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public int $companyId,
        public int $roleId,
        public int $assignedBy,
    ) {}
}
```

### 3. Create Action (business logic)

```php
<?php
// app/Actions/Users/StoreUserAction.php
namespace App\Actions\Users;

use App\DTO\Users\StoreUserDTO;
use App\Models\User;
use App\Notifications\WelcomeUserNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StoreUserAction
{
    public function execute(StoreUserDTO $dto): User
    {
        return DB::transaction(function () use ($dto): User {
            $user = User::create([...]);
            $user->userRole()->create([...]);
            // send invite email
            return $user;
        });
    }
}
```

### 4. Create Resource (output format)

```php
<?php
// app/Http/Resources/Api/V1/UserResource.php
namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'name'         => $this->name,
            'email'        => $this->email,
            'is_superadmin' => $this->is_superadmin,
            'is_active'    => $this->is_active,
            'company'      => $this->whenLoaded('company', fn () => [...]),
            'role'         => $this->whenLoaded('userRole', fn () => [...]),
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'created_at'   => $this->created_at->toIso8601String(),
        ];
    }
}
```

### 5. Create Controller

```php
<?php
// app/Http/Controllers/Api/V1/Users/UserController.php
namespace App\Http\Controllers\Api\V1\Users;

class UserController extends Controller
{
    public function store(StoreUserRequest $request): JsonResponse
    {
        $dto = new StoreUserDTO(
            name: $request->name,
            email: $request->email,
            companyId: $request->company_id,
            roleId: $request->role_id,
            assignedBy: $request->user()->id,
        );

        $user = (new StoreUserAction)->execute($dto);
        $user->load(['company', 'userRole.role.permissions']);

        return response()->json(new UserResource($user), 201);
    }
}
```

### 6. Add Route

```php
// routes/api.php
Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('users', UserController::class);
    Route::post('/users/{user}/resend-invite', ResendInviteController::class);
    Route::post('/users/{user}/disable', DisableUserController::class);
});
```

---

## Microsoft SSO Callback (Special Case)

The Microsoft OAuth callback is a **web route**, not an API route. This is because Microsoft redirects the browser directly to it — no Bearer token exists at this point.

```php
// routes/web.php — NOT routes/api.php
Route::get('/auth/microsoft/callback', MicrosoftCallbackController::class)
    ->name('auth.microsoft.callback');
```

The callback controller must:
1. Exchange the OAuth code via Socialite (stateless)
2. Find the existing user by email — **never auto-create**
3. Return `account_not_found` redirect if no user exists
4. Return `account_disabled` redirect if `is_active = false`
5. Upsert `social_accounts` row
6. Issue a Sanctum plain-text token
7. Redirect to `{FRONTEND_URL}/auth/callback?token={token}&user={base64(UserResource)}`

---

## User Management Rules

- **Admins create users** — there is no self-registration endpoint.
- `POST /api/v1/users` always sends a welcome email with an invite link.
- Invite links use the `password_reset_tokens` table with a 60-minute expiry.
- `ResendInviteController` only works on users with `password = null` (never set).
- `DisableUserController` toggles `is_active` — it does not delete the user.
- Superadmin accounts cannot be deleted or disabled via any endpoint.
- A user cannot delete or disable their own account.

---

## Authorization Model

### Superadmin
- `is_superadmin = true` on the `users` table
- Can access all companies, all users, all networks
- Can edit system roles

### Company Admin
- Has a role with admin-level permissions scoped to their `company_id`
- Can only manage users within their own company
- Cannot access other companies' data

### Role + Permission System
- `roles` table: named roles, `is_system_role` flag
- `permissions` table: keyed strings e.g. `user.create`, `node.view`
- `role_permissions` pivot: which permissions a role has
- `users.role_id`: one role per user (enforced by FK + validation)
- `role_companies` pivot: which companies a role is scoped to
- `role_networks` pivot: which networks a role can access

---

## Adding Internal Endpoints

Internal endpoints are for backend services (IoT services) and use token-based auth:

1. Create controller in `app/Http/Controllers/Internal/`
2. Add route to `routes/internal.php`
3. Routes automatically protected by `internal.token` middleware
4. Backend services must send `X-Internal-Token` header

```php
// routes/internal.php
Route::post('/devices/{id}/sync', [DeviceController::class, 'sync']);
```

---

## Command State Machine

Commands follow a strict state machine:

```
PENDING -> QUEUED -> DISPATCHED -> ACKED -> COMPLETED
   |         |          |           |
   v         v          v           v
FAILED    FAILED    FAILED      FAILED
TIMEOUT   TIMEOUT   TIMEOUT     TIMEOUT
```

**Rules:**
- Transitions are validated in `CommandStatus::canTransitionTo()`
- Use `Command::transitionTo()` method (sets timestamps automatically)
- Terminal states (COMPLETED, FAILED, TIMEOUT) cannot transition
- Duplicate transitions are safe (idempotent)

---

## Coding Standards

### SOLID Principles

- **Single Responsibility**: Each Action handles one use case. Each `__invoke` controller handles one route.
- **Open/Closed**: Extend via new Actions, don't modify existing ones.
- **Liskov Substitution**: Resources and DTOs are interchangeable.
- **Interface Segregation**: Keep interfaces focused.
- **Dependency Inversion**: Controllers depend on Actions, not models directly.

### Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Resource controllers | `{Resource}Controller` | `UserController` |
| Single-action controllers | `{Verb}{Resource}Controller` | `DisableUserController` |
| Actions | `{Verb}{Resource}Action` | `StoreUserAction` |
| DTOs | `{Verb}{Resource}DTO` | `StoreUserDTO` |
| Resources | `{Resource}Resource` | `UserResource` |
| Form Requests | `{Verb}{Resource}Request` | `StoreUserRequest`, `UpdateUserRequest` |
| Notifications | `{Adjective}{Resource}Notification` | `WelcomeUserNotification` |

### Type Safety

- Use `declare(strict_types=1);` in all PHP files
- Use Enums for status fields
- Use readonly DTOs where possible
- Type-hint all method parameters and return types

### Database Transactions

Use transactions for operations that must be atomic:

```php
DB::transaction(function () {
    $user = User::create([...]);
    $user->userRole()->create([...]);
    DB::table('password_reset_tokens')->upsert([...]);
    $user->notify(new WelcomeUserNotification($token));
    return $user;
});
```

---

## Testing Standards

### Feature Tests (Pest)

- Test happy paths
- Test validation errors
- Test authorization (401/403)
- Test state machine transitions
- Test SSO flows (mock Socialite)
- Use factories for test data

```php
test('admin can create user and invite email is sent', function () {
    $admin = User::factory()->create(['is_superadmin' => true]);
    Notification::fake();

    $response = $this->actingAs($admin, 'sanctum')
        ->postJson('/api/v1/users', [
            'name'       => 'John Doe',
            'email'      => 'john@example.com',
            'company_id' => 1,
            'role_id'    => 1,
        ]);

    $response->assertStatus(201);
    Notification::assertSentTo(User::where('email', 'john@example.com')->first(), WelcomeUserNotification::class);
});

test('sso login fails gracefully for unknown email', function () {
    Socialite::shouldReceive('driver->stateless->user')
        ->andReturn((object)['email' => 'unknown@example.com', 'id' => '123']);

    $response = $this->get('/auth/microsoft/callback');
    $response->assertRedirect(config('app.frontend_url') . '/login?error=account_not_found');
});
```

---

## Logging & Correlation

- Every request gets a correlation ID via `X-Request-Id` header
- Log context includes: `request_id`, `user_id`, `command_id`, `device_id`
- Never log secrets, passwords, tokens, or OAuth codes
- Use structured logging (JSON format in production)

---

## Error Responses

All errors follow this format:

```json
{
    "message": "The given data was invalid.",
    "errors": {
        "field": ["Error message"]
    }
}
```

SSO errors are communicated as query parameters on the frontend redirect, not as JSON:

```
{FRONTEND_URL}/login?error=account_not_found
{FRONTEND_URL}/login?error=account_disabled
{FRONTEND_URL}/login?error=sso_failed
{FRONTEND_URL}/login?error=no_email
```

HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `500`: Server Error