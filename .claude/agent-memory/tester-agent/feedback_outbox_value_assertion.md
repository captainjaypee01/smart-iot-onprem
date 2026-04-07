---
name: Outbox event command_id value assertion gap
description: Tests that only assert the presence of a command_id key in the outbox payload miss value correctness; always verify the value equals the HTTP response command ID
type: feedback
---

When reviewing outbox event tests, flag any test that only checks `toHaveKey('command_id')` without also asserting the value matches `$response->json('data.id')` as a MEDIUM gap.

**Why:** A bug where the action writes a wrong or stale command_id into the outbox would pass the key-existence check but silently corrupt the dispatch pipeline. Value verification is the minimum bar.

**How to apply:** In GatewayCommandTest and any future command-creation test, confirm the assertion reads: `$outbox->payload['command_id'] === $response->json('data.id')`. Flag the absence as MEDIUM, not LOW, since outbox correctness is load-bearing for the dispatch pipeline.
