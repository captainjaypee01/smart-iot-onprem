---
name: api-standard-rule
description: This rule is for API folder or for the API architecture under /api folder
---

# Overview

# Laravel 12 API Standards (Smart IoT On-Prem)

## Architecture
- Controllers are thin orchestration only. No business logic.
- Every endpoint must use:
  - FormRequest for validation/authorize
  - Action class for business logic/transactions
  - Resource for API response
- Group Actions by domain:
  - app/Actions/Auth
  - app/Actions/Commands
  - app/Actions/Devices
- Do NOT implement repository-per-model or generic Service+Repository pattern.
  - Repositories only allowed for complex reusable query logic (read-side).

## Interfaces / DIP
- Contracts/interfaces only for boundaries (e.g., Outbox publisher, MQTT client).
- Bind implementations in a ServiceProvider.
- Prefer Laravel facades only when appropriate; keep testability.

## API Boundaries
- Public API: /api/v1/* uses Sanctum (SPA cookie)
- Internal API: /internal/* uses X-Internal-Token header middleware
- Internal endpoints must be idempotent.

## Command Lifecycle
- Command status is Enum.
- Guard transitions in a single place (small service/state machine).
- Store command + outbox_event in one DB transaction.

## Quality
- Use Pint formatting.
- Use Pest tests for all endpoints.
- Include Correlation ID middleware and return X-Request-Id.

## Docs
- Keep docs in /docs:
  - API_GUIDELINES.md
  - SECURITY.md
  - DECISIONS.md
