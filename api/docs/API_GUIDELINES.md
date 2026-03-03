# API Development Guidelines

This document outlines the coding standards, architecture patterns, and best practices for the Smart IoT On-Prem API.

## Folder Structure

```
app/
├── Actions/              # Use-case classes (business logic)
│   ├── Commands/         # Command-related actions
│   └── Auth/             # Authentication actions (future)
├── Contracts/            # Interfaces for dependency injection
├── DTO/                  # Data Transfer Objects (immutable input/output)
│   └── Commands/         # Command-related DTOs
├── Enums/                # Type-safe enumerations
├── Services/             # Service classes (e.g., OutboxPublisherService)
├── Http/
│   ├── Controllers/
│   │   ├── Api/V1/       # Public API controllers (SPA)
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
└── internal.php          # Internal API routes (/internal/*)
```

## Adding a New Endpoint

### 1. Create FormRequest (if needed)

```php
<?php
// app/Http/Requests/Api/V1/CreateDeviceRequest.php
namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class CreateDeviceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Or use policies
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'device_id' => ['required', 'string', 'unique:devices'],
        ];
    }
}
```

### 2. Create DTO (if complex input)

```php
<?php
// app/DTO/CreateDeviceDTO.php
namespace App\DTO;

readonly class CreateDeviceDTO
{
    public function __construct(
        public string $name,
        public string $deviceId,
        public ?string $userId = null,
    ) {}
}
```

### 3. Create Action (business logic)

```php
<?php
// app/Actions/CreateDeviceAction.php
namespace App\Actions;

use App\DTO\CreateDeviceDTO;
use App\Models\Device;

class CreateDeviceAction
{
    public function execute(CreateDeviceDTO $dto): Device
    {
        return Device::create([
            'name' => $dto->name,
            'device_id' => $dto->deviceId,
            'user_id' => $dto->userId,
        ]);
    }
}
```

### 4. Create Resource (output format)

```php
<?php
// app/Http/Resources/Api/V1/DeviceResource.php
namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeviceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'device_id' => $this->device_id,
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
```

### 5. Create Controller

```php
<?php
// app/Http/Controllers/Api/V1/DeviceController.php
namespace App\Http\Controllers\Api\V1;

use App\Actions\CreateDeviceAction;
use App\DTO\CreateDeviceDTO;
use App\Http\Requests\Api\V1\CreateDeviceRequest;
use App\Http\Resources\Api\V1\DeviceResource;

class DeviceController extends Controller
{
    public function __construct(
        private readonly CreateDeviceAction $createDeviceAction
    ) {}

    public function store(CreateDeviceRequest $request)
    {
        $dto = new CreateDeviceDTO(
            name: $request->input('name'),
            deviceId: $request->input('device_id'),
            userId: (string) $request->user()?->id,
        );

        $device = $this->createDeviceAction->execute($dto);

        return response()->json([
            'data' => new DeviceResource($device),
        ], 201);
    }
}
```

### 6. Add Route

```php
// routes/api.php
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/devices', [DeviceController::class, 'store']);
});
```

## Adding Internal Endpoints

Internal endpoints are for backend services (IoT services) and use token-based auth:

1. Create controller in `app/Http/Controllers/Internal/`
2. Add route to `routes/internal.php`
3. Routes automatically protected by `internal.token` middleware
4. Backend services must send `X-Internal-Token` header

Example:

```php
// routes/internal.php
Route::post('/devices/{id}/sync', [DeviceController::class, 'sync']);
```

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

## Coding Standards

### SOLID Principles

- **Single Responsibility**: Each Action handles one use case
- **Open/Closed**: Extend via new Actions, don't modify existing ones
- **Liskov Substitution**: Resources and DTOs are interchangeable
- **Interface Segregation**: Keep interfaces focused
- **Dependency Inversion**: Controllers depend on Actions, not models directly

### Naming Conventions

- **Controllers**: `{Resource}Controller` (e.g., `DeviceController`)
- **Actions**: `{Verb}{Resource}Action` (e.g., `CreateDeviceAction`)
- **DTOs**: `{Verb}{Resource}DTO` (e.g., `CreateDeviceDTO`)
- **Resources**: `{Resource}Resource` (e.g., `DeviceResource`)
- **Requests**: `{Verb}{Resource}Request` (e.g., `CreateDeviceRequest`)

### Type Safety

- Use `declare(strict_types=1);` in all PHP files
- Use Enums for status fields
- Use readonly DTOs where possible
- Type-hint all method parameters and return types

### Database Transactions

Use transactions for operations that must be atomic:

```php
DB::transaction(function () {
    $command = Command::create([...]);
    OutboxEvent::create([...]);
    return $command;
});
```

## Testing Standards

### Feature Tests (Pest)

- Test happy paths
- Test validation errors
- Test authorization (401/403)
- Test state machine transitions
- Use factories for test data

Example:

```php
test('user can create device', function () {
    $user = User::factory()->create();
    
    $response = $this->actingAs($user)
        ->postJson('/api/v1/devices', [
            'name' => 'Test Device',
            'device_id' => 'test-123',
        ]);
    
    $response->assertStatus(201);
    expect(Device::count())->toBe(1);
});
```

## Logging & Correlation

- Every request gets a correlation ID via `X-Request-Id` header
- Log context includes: `request_id`, `user_id`, `command_id`, `device_id`
- Never log secrets, passwords, or tokens
- Use structured logging (JSON format in production)

Example:

```php
logger()->withContext([
    'request_id' => $request->header('X-Request-Id'),
    'command_id' => $command->id,
])->info('Command created');
```

## Error Responses

All errors follow this format:

```json
{
    "message": "The given data was invalid.",
    "errors": {
        "field": ["Error message"]
    },
    "request_id": "uuid-here"
}
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
