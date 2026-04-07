---
name: DTO dead field — action ignores DTO property
description: Action may hardcode a value instead of reading a DTO field, making the DTO property dead code; always verify every DTO field is consumed by its action
type: feedback
---

When validating an action against its DTO, read both the DTO constructor and the action's create/fill array side-by-side. A field may be present in the DTO but the action may hardcode the corresponding value instead of reading `$dto->fieldName`. This is a silent data-loss bug: the form request validates and the DTO carries the value, but the action ignores it and writes a hardcoded default.

**Why:** Found in `CreateGatewayAction`: `$dto->isTestMode` was properly carried from controller to DTO, but the action hardcoded `'is_test_mode' => false` instead of `$dto->isTestMode`. This caused a cross-layer inconsistency across three files (form request, DTO, action) where no single layer was obviously wrong in isolation.

**How to apply:** During the Actions layer check, for every field in a DTO that the action is supposed to use, confirm the action reads `$dto->fieldName` and does not substitute a hardcoded value. If a hardcoded value is intentional (e.g., default false for a field not in the spec), the DTO field should not carry that property at all. Flag as HIGH if the inconsistency is cross-layer (request accepts + DTO carries + action ignores).
