---
name: Missing correlation_id in command actions — CRITICAL pattern
description: Command create actions for gateway/provisioning modules often omit correlation_id; also absent from Command::$fillable — flag both as CRITICAL
type: feedback
---

When validating any action that creates a `Command` record and interacts with the outbox pipeline, always verify that `correlation_id` is:

1. Set in the `Command::create([...])` array (value: `Str::uuid()`)
2. Present in `Command::$fillable` in `api/app/Models/Command.php`

**Why:** The gateway module's `CreateGatewayCommandAction` omitted `correlation_id` entirely — the spec requires it for correlating ack events back to commands in the outbox/dispatch pipeline. The legacy `CreateCommandAction` pre-dates this field and also does not set it, so it is not a reliable comparison reference for this specific field.

**How to apply:** On every actions layer check that touches command creation — including gateway commands, provisioning commands, and any future command type — explicitly cross-check the `Command::create([...])` field list against the spec field mapping table, and separately verify `Command::$fillable` includes `correlation_id`. Two distinct CRITICAL failures if either is absent.
