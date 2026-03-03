# Architecture Decision Records (ADRs)

This document records key architectural decisions and their rationale.

## ADR-001: Sanctum Cookie-Based SPA Authentication

**Status**: Accepted  
**Date**: 2026-01-16  
**Context**: Need to authenticate React SPA with Laravel API.

**Decision**: Use Laravel Sanctum with cookie-based sessions instead of token-based auth.

**Rationale**:
- **Security**: Cookies are automatically sent by browsers, reducing XSS risk compared to localStorage tokens
- **CSRF Protection**: Sanctum provides built-in CSRF protection for stateful requests
- **Simplicity**: No need to manage token storage/refresh in SPA
- **Laravel Native**: Sanctum is Laravel's official SPA auth solution

**Alternatives Considered**:
- **JWT Tokens**: More complex, requires token refresh logic, higher XSS risk
- **OAuth2**: Overkill for single-tenant on-prem deployment

**Consequences**:
- SPA must be on same domain or configure CORS properly
- Requires CSRF cookie fetch before login
- Session management handled by Laravel

---

## ADR-002: Internal Token Authentication for Backend Services

**Status**: Accepted  
**Date**: 2026-01-16  
**Context**: Backend services (IoT services) need to call API internal endpoints.

**Decision**: Use simple token-based authentication via `X-Internal-Token` header.

**Rationale**:
- **Simplicity**: Single shared secret, easy to configure
- **Performance**: No OAuth/JWT overhead
- **On-Prem Context**: Services run in same network, lower security risk
- **Stateless**: No session management needed

**Alternatives Considered**:
- **OAuth2 Client Credentials**: More complex, requires token management
- **mTLS**: Overkill for internal network communication
- **API Keys per Service**: More flexible but adds complexity

**Consequences**:
- Token rotation requires coordination across services
- Single token compromise affects all services
- No per-service audit trail (future enhancement: add service identifier)

---

## ADR-003: Outbox Pattern for Event-Driven Architecture

**Status**: Accepted  
**Date**: 2026-01-16  
**Context**: Need reliable event publishing (command creation -> Redis Streams) without losing events.

**Decision**: Use transactional outbox pattern: write command + outbox event in same DB transaction.

**Rationale**:
- **Reliability**: Ensures events are never lost (atomic write)
- **Consistency**: Command and event creation are atomic
- **Decoupling**: Publisher service can be separate from API
- **Retry Safety**: Publisher can retry failed events idempotently

**Alternatives Considered**:
- **Direct Redis Publish**: Risk of losing events if API crashes after DB write
- **Database Polling**: Adds latency, increases DB load
- **Message Queue**: Adds infrastructure complexity (RabbitMQ/Kafka)

**Consequences**:
- Requires outbox publisher service (to be implemented)
- Events may be delayed if publisher is down (acceptable for IoT use case)
- Need to handle duplicate events (idempotent consumers)

---

## ADR-004: Command State Machine

**Status**: Accepted  
**Date**: 2026-01-16  
**Context**: Commands transition through multiple states (PENDING -> DISPATCHED -> ACKED -> COMPLETED).

**Decision**: Implement explicit state machine with enum and transition validation.

**Rationale**:
- **Type Safety**: Enum prevents invalid states
- **Validation**: `canTransitionTo()` prevents invalid transitions
- **Idempotency**: Safe to retry transitions (no-op if already in target state)
- **Auditability**: Timestamps track when each state was reached

**State Flow**:
```
PENDING -> QUEUED -> DISPATCHED -> ACKED -> COMPLETED
   |         |          |           |
   v         v          v           v
FAILED    FAILED    FAILED      FAILED
TIMEOUT   TIMEOUT   TIMEOUT     TIMEOUT
```

**Consequences**:
- Must handle late acks (idempotent)
- Terminal states cannot transition (by design)
- Duplicate events must be handled safely

---

## ADR-005: ULIDs for Command IDs

**Status**: Accepted  
**Date**: 2026-01-16  
**Context**: Need unique identifiers for commands that are URL-safe and sortable.

**Decision**: Use ULIDs (Universally Unique Lexicographically Sortable Identifiers) instead of UUIDs or auto-increment IDs.

**Rationale**:
- **Sortable**: Lexicographically sortable by creation time
- **URL-Safe**: No special characters
- **Privacy**: Don't expose sequence numbers (unlike auto-increment)
- **Distributed**: Can be generated without coordination

**Alternatives Considered**:
- **UUIDs**: Not sortable, harder to debug
- **Auto-increment**: Exposes sequence, not distributed-safe
- **Snowflake IDs**: Requires coordination service

**Consequences**:
- Slightly longer than UUIDs (26 chars vs 36)
- Requires `HasUlids` trait in models

---

## ADR-006: Actions Pattern for Business Logic

**Status**: Accepted  
**Date**: 2026-01-16  
**Context**: Need to organize business logic without bloating controllers or models.

**Decision**: Use Action classes (use-case pattern) for business logic.

**Rationale**:
- **Single Responsibility**: Each action handles one use case
- **Testability**: Easy to unit test actions in isolation
- **Reusability**: Actions can be called from controllers, jobs, commands
- **Thin Controllers**: Controllers only orchestrate (validation -> action -> response)

**Structure**:
```
app/Actions/
  CreateCommandAction.php
  MarkCommandDispatchedAction.php
  ...
```

**Consequences**:
- More files to manage
- Need to inject actions into controllers (dependency injection)
- Actions should be stateless (no instance variables)

---

## ADR-007: DTOs for Input Normalization

**Status**: Accepted  
**Date**: 2026-01-16  
**Context**: Need to normalize and validate input data before passing to actions.

**Decision**: Use readonly DTOs (Data Transfer Objects) for action inputs.

**Rationale**:
- **Type Safety**: Explicit types for all inputs
- **Immutability**: Readonly prevents accidental mutation
- **Documentation**: DTOs serve as contracts
- **Validation**: DTOs can validate data structure

**Example**:
```php
readonly class CreateCommandDTO
{
    public function __construct(
        public string $type,
        public array $payload,
        public string $correlationId,
    ) {}
}
```

**Consequences**:
- More classes to maintain
- Requires mapping from FormRequest to DTO (acceptable overhead)

---

## ADR-008: Correlation IDs for Observability

**Status**: Accepted  
**Date**: 2026-01-16  
**Context**: Need to trace requests across services and logs.

**Decision**: Use `X-Request-Id` header for correlation IDs, auto-generate if missing.

**Rationale**:
- **Tracing**: Follow requests across API -> Redis -> MQTT -> Backend Services
- **Debugging**: Easy to grep logs by correlation ID
- **Observability**: Essential for distributed systems
- **Standard**: Common pattern in microservices

**Implementation**:
- Middleware adds correlation ID to request/response headers
- Log context includes correlation ID automatically
- Commands store correlation ID for matching MQTT acks

**Consequences**:
- Slight overhead (UUID generation)
- Requires all services to propagate header (documentation needed)

---

## ADR-009: Pest for Testing

**Status**: Accepted  
**Date**: 2026-01-16  
**Context**: Need modern, readable test framework.

**Decision**: Use Pest instead of PHPUnit directly.

**Rationale**:
- **Readability**: More expressive test syntax
- **Laravel Integration**: `pestphp/pest-plugin-laravel` provides helpers
- **Modern**: Built on PHPUnit, adds better DX
- **Community**: Growing adoption in Laravel community

**Example**:
```php
test('user can create command', function () {
    $user = User::factory()->create();
    // ...
});
```

**Consequences**:
- Team needs to learn Pest syntax (minimal learning curve)
- Still uses PHPUnit under the hood (compatible)

---

## ADR-010: PHPStan for Static Analysis

**Status**: Accepted  
**Date**: 2026-01-16  
**Context**: Need to catch type errors before runtime.

**Decision**: Use PHPStan (via Larastan) for static analysis.

**Rationale**:
- **Type Safety**: Catches type errors, null pointer exceptions
- **Laravel Support**: Larastan understands Laravel patterns
- **CI Integration**: Can fail builds on type errors
- **Gradual Adoption**: Start with baseline, increase level over time

**Consequences**:
- Requires type annotations (good practice)
- May need to suppress some false positives initially
- Adds to CI pipeline time
