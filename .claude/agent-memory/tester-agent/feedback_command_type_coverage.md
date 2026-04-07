---
name: Command type enum coverage — all allowed types must be tested
description: Test suites that only exercise 2 of N allowed command types create a silent gap; flag any coverage below full enum as MEDIUM
type: feedback
---

When reviewing command endpoint tests (e.g. POST /gateways/{id}/commands, POST /commands), verify that all allowed `type` values in the spec are positively tested with a 201 response.

**Why:** If a type is silently omitted from the enum or the validation `in:` rule, no test will catch it. The GatewayCommandTest exercised only `get_configs` and `diagnostic` out of 9 allowed types — the remaining 7 were completely unguarded.

**How to apply:** Count the allowed types in the spec. Count the distinct types exercised by positive tests. If coverage is less than 100%, flag as MEDIUM. Recommend a Pest `dataset()` covering all types as the fix.
