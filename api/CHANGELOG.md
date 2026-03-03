# Changelog

## 2026-01-16 - Foundation Improvements

### Added

#### Package Dependencies
- Added `spatie/laravel-data` to `composer.json` (requires resolving Pest/PHPUnit version conflict before installation)

#### Folder Reorganization
- **Actions**: Reorganized by domain
  - `app/Actions/Commands/` - All command-related actions
  - Future: `app/Actions/Auth/` for authentication actions
- **DTOs**: Reorganized by domain
  - `app/DTO/Commands/` - All command-related DTOs

#### Outbox Publisher Service
- Created `OutboxPublisherContract` interface
- Implemented `OutboxPublisherService` that publishes events to Redis Streams
- Added `PublishOutboxEventsCommand` artisan command
- Bound contract in `AppServiceProvider`

#### Rate Limiting
- Added rate limiting to internal API endpoints (1000 requests/minute)
- Applied via `throttle:1000,1` middleware on internal routes

#### Configuration
- Created `env.example` with production-ready environment variables
- Includes all necessary settings for:
  - Sanctum SPA authentication
  - CORS configuration
  - Session management
  - Redis configuration
  - Database configuration
  - Internal API token

### Changed

#### Namespace Updates
- `App\Actions\*` → `App\Actions\Commands\*`
- `App\DTO\*` → `App\DTO\Commands\*`
- Updated all controller imports
- Updated all action/DTO references

#### Documentation
- Updated `API_GUIDELINES.md` with new folder structure
- Updated `README.md` with:
  - New folder structure
  - Outbox publisher information
  - Environment variable notes

### Files Moved

**Actions:**
- `app/Actions/CreateCommandAction.php` → `app/Actions/Commands/CreateCommandAction.php`
- `app/Actions/MarkCommandDispatchedAction.php` → `app/Actions/Commands/MarkCommandDispatchedAction.php`
- `app/Actions/MarkCommandAckedAction.php` → `app/Actions/Commands/MarkCommandAckedAction.php`
- `app/Actions/MarkCommandCompletedAction.php` → `app/Actions/Commands/MarkCommandCompletedAction.php`
- `app/Actions/MarkCommandFailedAction.php` → `app/Actions/Commands/MarkCommandFailedAction.php`

**DTOs:**
- `app/DTO/CreateCommandDTO.php` → `app/DTO/Commands/CreateCommandDTO.php`
- `app/DTO/UpdateCommandStatusDTO.php` → `app/DTO/Commands/UpdateCommandStatusDTO.php`

### New Files

- `app/Contracts/OutboxPublisherContract.php`
- `app/Services/OutboxPublisherService.php`
- `app/Console/Commands/PublishOutboxEventsCommand.php`
- `api/env.example`

### Next Steps

1. **Resolve dependency conflict**: Fix Pest/PHPUnit version conflict, then run `composer update` to install `spatie/laravel-data`
2. **Optional**: Convert DTOs to use `spatie/laravel-data` for enhanced features (validation, transformation, etc.)
3. **Schedule outbox publisher**: Add cron job to run `php artisan outbox:publish` periodically
4. **Production deployment**: Copy `env.example` to `.env` and configure all production values
