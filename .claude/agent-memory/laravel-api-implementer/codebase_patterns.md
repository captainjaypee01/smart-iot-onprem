---
name: Codebase Patterns
description: Key architectural patterns discovered in the smart-iot-onprem Laravel API codebase
type: project
---

## Actions
- Live in `app/Actions/{Domain}/` (e.g., `app/Actions/Commands/`)
- Use `final class` or regular `class`, inject deps via constructor
- Return the model directly, not arrays
- Always wrap DB writes + outbox event in `DB::transaction()`

## DTOs
- Live in `app/DTO/{Domain}/`
- Use `readonly class` with named constructor params
- For backward-compat evolution: add optional params with defaults at the end

## Resources
- Live in `app/Http/Resources/Api/V1/` (flat for now, not subdirectory-nested)
- Always check `$command->relationLoaded('relation')` before accessing related data
- Return integer values for enum fields alongside `_label` strings

## Policies
- Live in `app/Policies/`
- Auto-discovered by Laravel (no registration needed in AppServiceProvider)
- Use `$user->hasPermission('key')` which checks `is_superadmin` first

## Controllers
- Public API: `app/Http/Controllers/Api/V1/{Domain}/`
- Internal: `app/Http/Controllers/Api/V1/{Domain}/InternalXxxController.php` (NOT `app/Http/Controllers/Internal/`)
- Thin: `$this->authorize() → validate → action → resource`
- Use `$this->authorize('policy_method', Model::class)` for collection-level, `$this->authorize('method', $instance)` for instance-level

## Routes
- Public API routes: `routes/api.php` under `Route::prefix('v1')` + `middleware('auth:sanctum')`
- Internal routes: `routes/internal.php` under `Route::prefix('internal')` + `middleware(['internal.token', ...])`
- PATCH for status updates, POST for create/resend

## Outbox Pattern
- Always `OutboxEvent::create([...])` inside the same `DB::transaction()` as the command write
- `aggregate_type: 'command'`, `aggregate_id: $command->id`, `event_name: 'command.send_data.created'`

## Enums
- Live in `app/Enums/`
- Int-backed for DB storage (processing_status, message_status)
- String-backed for legacy (CommandStatus)
- Add `label()` method for human-readable output in resources

## Factories
- `CommandFactory` now requires `network_id` (Network::factory()) and `created_by` (User::factory())
- Old legacy tests (`CommandTest.php`, `InternalApiTest.php`) use the old factory shape — they may break

## Permission Model
- Columns: `key`, `display_name`, `module`, `description`
- Use `Permission::firstOrCreate(['key' => 'x'], ['display_name' => '...', 'module' => '...'])`
- NOT `name` — it's `display_name`
