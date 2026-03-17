# API Development Guidelines

This document outlines the coding standards, architecture patterns, and best practices for the Smart IoT On-Prem API.

## Folder Structure

```
app/
├── Actions/              # Use-case classes (business logic)
│   ├── Commands/         # Command-related actions
│   ├── Auth/             # Authentication actions
│   └── Settings/         # Settings actions (GetSessionSettingsAction, UpdateSessionSettingsAction)
├── Contracts/            # Interfaces for dependency injection
├── DTO/                  # Data Transfer Objects (immutable input/output)
│   ├── Commands/         # Command-related DTOs
│   └── Settings/         # Settings DTOs (UpdateSessionSettingsDTO)
├── Enums/                # Type-safe enumerations
├── Services/             # Service classes (e.g., OutboxPublisherService)
├── Notifications/        # Laravel notification classes (e.g., WelcomeUserNotification)
├── Http/
│   ├── Controllers/
│   │   ├── Api/V1/       # Public API controllers (SPA)
│   │   │   ├── Auth/       # Auth controllers (Login, Logout, Me, MicrosoftRedirect, SetPassword)
│   │   │   ├── Companies/  # IndexCompaniesController (GET /companies/options)
│   │   │   ├── Roles/      # IndexRolesController (GET /roles/options)
│   │   │   ├── Settings/   # SessionSettingsController (thin; delegates to Actions)
│   │   │   └── Users/      # UserController, ResendInviteController, DisableUserController
│   │   ├── Auth/         # Web-route controllers (MicrosoftCallbackController)
│   │   └── Internal/     # Internal API controllers (backend services)
│   ├── Middleware/       # Custom middleware
│   ├── Requests/
│   │   └── Api/V1/       # FormRequest validation classes (Users/, Auth/, Settings/, etc.)
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

### Single controller per module

For most modules, prefer a **single controller class per resource** that owns the
standard CRUD actions (index, show, store, update, destroy) and any closely related
behaviour. This keeps routing discoverable and keeps cross-cutting concerns (like
permission checks) in one place.

```php
// ✅ One controller per module
class PermissionController extends Controller
{
    public function index(): JsonResponse { ... }   // GET    /permissions (grouped)
    public function options(): JsonResponse { ... } // GET    /permissions/options
    public function show(Permission $permission): PermissionResource { ... }
    public function store(StorePermissionRequest $request): JsonResponse { ... }
    public function update(UpdatePermissionRequest $request, Permission $permission): PermissionResource { ... }
    public function destroy(Request $request, Permission $permission): JsonResponse { ... }
}
```

### Single-Action Controllers (`__invoke`)

Use for routes that do **one isolated thing** and don't share logic with sibling routes.
This remains the preferred pattern for auth routes and one-off state-change actions.

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

### Resource-like Controllers (Named Methods)

Use for modules with standard CRUD operations. You can register with `Route::apiResource`
or with explicit routes, but keep all core actions on a single controller.

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

**Use single controllers for:** `UserController`, `CompanyController`, `NetworkController`,
`RoleController`, `PermissionController`, and any future CRUD modules. Reserve single-action
controllers for auth and truly one-off operations.

---

## Permissions and Authorization

### Where to enforce

- **FormRequest `authorize()`** — Use for create and update. Check the appropriate permission first, then apply scope (e.g. company) or superadmin bypass.
- **Controller** — For index/show and one-off actions (disable, resend-invite, delete), check the permission at the top of the method or `__invoke` before running business logic.

### Pattern: permission then scope

1. **Permission check:** `$authUser->hasPermission('user.create')` (or `user.update`, `user.view`, etc.). Return 403 if false.
2. **Scope / superadmin:** Superadmin typically bypasses scope; company admin is restricted to their `company_id` (e.g. target user’s company must match auth user’s company, or request’s `company_id` must match for create).

### User module permission keys

| Key | Enforced in | Purpose |
|-----|-------------|---------|
| `user.view` | UserController@index, @show | List and view users |
| `user.create` | StoreUserRequest::authorize() | Create/invite user |
| `user.update` | UpdateUserRequest::authorize(), ResendInviteController | Update user, resend invite |
| `user.delete` | UserController@destroy | Soft-delete user |
| `user.disable` | DisableUserController | Toggle is_active |
| `user.resend_invite` | ResendInviteController | Resend welcome email |
| `user.change_status` | UpdateUserRequest (rules: superadmin may send `status`) | Change user status (active/locked/disabled) |
| `user.change_company` | UpdateUserRequest (rules: superadmin may send `company_id`) | Reassign user to another company |

Superadmin bypass is usually applied **after** the permission check (e.g. in authorize: if not permitted return false; if superadmin return true; else check company scope). See [PERMISSIONS.md](PERMISSIONS.md) for the full list and role assignments.

---

## Options vs index endpoints

For dropdown/lookup data that must **not** change when a full CRUD module is added later:

- **Use `/resource/options`** — Returns a simple list (no pagination). Example: `GET /api/v1/companies/options`, `GET /api/v1/roles/options?company_id=1`. Contract and response shape stay fixed.
- **Reserve `GET /resource`** — For the future paginated index when you add a full Company or Role module. Do not use the same path for the simple list.

This avoids breaking the frontend when you later introduce paginated index responses with `meta` and `links`.

---

## Pagination (index endpoints)

For list endpoints that return many records (e.g. users):

- Accept `page` and `per_page` query parameters. Clamp `per_page` (e.g. 1–100); default 15.
- Return Laravel’s paginator response: `{ data: [...], meta: { current_page, last_page, per_page, total }, links: { first, next, prev, last } }`.
- Use `UserResource::collection($query->paginate($perPage))` so the shape matches the shared contract.

---

## Adding a New Endpoint

### 1. Create FormRequest (if needed)

Put **permission and scope** in `authorize()`. Use **rules()** for input validation (and for superadmin-only fields use `prohibited` for non-superadmin).

```php
<?php
// app/Http/Requests/Api/V1/Users/StoreUserRequest.php
namespace App\Http\Requests\Api\V1\Users;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $authUser = $this->user();
        if (! $authUser->hasPermission('user.create')) {
            return false;
        }
        if ($authUser->is_superadmin) {
            return true;
        }
        return (int) $this->company_id === (int) $authUser->company_id;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name'  => ['required', 'string', 'max:255'],
            'email'      => ['required', 'email', 'unique:users,email'],
            'company_id' => ['required', 'integer', 'exists:companies,id'],
            'role_id'    => ['required', 'integer', 'exists:roles,id'],
            // role_id should also be validated against role_companies for company_id
        ];
    }
}
```

### 2. Create DTO (if complex input)

Use a **readonly** DTO with typed properties. Include all inputs the action needs (e.g. first_name, last_name, companyId, roleId, optional password/useInvite for create; companyId/status for update when superadmin).

```php
<?php
// app/DTO/Users/StoreUserDTO.php
namespace App\DTO\Users;

readonly class StoreUserDTO
{
    public function __construct(
        public string $firstName,
        public string $lastName,
        public string $email,
        public ?string $username,
        public int $companyId,
        public int $roleId,
        public int $assignedBy,
        public bool $useInvite,
        public ?string $password,
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

Keep controllers **thin**: validate via FormRequest (including authorize), build DTO from validated input, call Action, return Resource or JSON. For **index/show** and **one-off actions** (delete, disable, resend-invite), check the required permission at the start of the method if not already enforced by a FormRequest.

```php
<?php
// app/Http/Controllers/Api/V1/Users/UserController.php
namespace App\Http\Controllers\Api\V1\Users;

class UserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        if (! $request->user()->hasPermission('user.view')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        $perPage = min(100, max(1, (int) $request->input('per_page', 15)));
        $users = User::query()->with(['company', 'role'])->...->paginate($perPage);
        return UserResource::collection($users);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $dto = new StoreUserDTO(
            firstName: $request->validated('first_name'),
            lastName: $request->validated('last_name'),
            email: $request->validated('email'),
            ...
            assignedBy: $request->user()->id,
        );
        $user = (new StoreUserAction)->execute($dto);
        $user->load(['company', 'role']);
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

- **Admins create users** — no self-registration. Create/invite requires `user.create` and (for non-superadmin) company scope.
- **Invite flow:** Default `POST /api/v1/users` creates user with `password = null`, stores invite token, sends `WelcomeUserNotification`. Superadmin may send `use_invite: false` and `password` to create with password and no email.
- **Resend invite:** `POST .../resend-invite` requires `user.resend_invite`; only valid when `last_login_at === null` and password not set.
- **Disable:** `POST .../disable` requires `user.disable`; toggles `is_active`. Superadmin and self cannot be disabled.
- **Update:** `PUT .../users/{id}` requires `user.update`. Superadmin may send `company_id` and `status`; company admin must not (validation prohibits).
- **Delete:** Requires `user.delete`; soft delete. Superadmin and self cannot be deleted.
- **Pagination:** `GET /api/v1/users` uses `?page` and `?per_page` (1–100); returns `{ data, meta, links }`.

---

## Authorization Model

### Superadmin
- `is_superadmin = true` on the `users` table. Bypasses permission checks and company scope.
- Can access all companies, all users; can change user `company_id` and `status` on update.

### Company admin
- Has a role with permissions (e.g. `user.view`, `user.create`, `user.update`, `user.disable`, `user.delete`, `user.resend_invite`) scoped to their `company_id`.
- Can only list/edit/disable/delete users in their own company. Cannot send `company_id` or `status` on update (validation prohibits).

### Role + permission system
- **Permissions:** `permissions` table with `key` (e.g. `user.view`, `user.create`, `user.update`, `user.delete`, `user.disable`, `user.resend_invite`, `user.change_status`, `user.change_company`). Seeded via `PermissionSeeder`.
- **User::hasPermission($key):** Returns true for superadmin; otherwise true if the user’s role has that permission (via `role_permissions`).
- **Enforcement:** FormRequest `authorize()` for create/update; controller checks for index/show and one-off actions. See [PERMISSIONS.md](PERMISSIONS.md) and the table in “Permissions and Authorization” above.
- **Scoping:** `role_companies` links roles to companies; `role_id` validation for users uses this so a role is only valid for a given company.

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