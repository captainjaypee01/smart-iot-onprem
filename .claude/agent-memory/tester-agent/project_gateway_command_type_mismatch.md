---
name: GatewayCommandType enum — RESOLVED
description: GatewayCommandType PHP enum was fixed to have all 9 spec-required cases; spurious restart_gateway case removed
type: project
---

The `GatewayCommandType` PHP enum (`api/app/Enums/GatewayCommandType.php`) was initially implemented with only 2 cases (`RestartGateway='restart_gateway'`, `Diagnostic='diagnostic'`). After a CRITICAL finding in the Enums Layer Check (2026-04-06), the implementing agent corrected it to have all 9 spec-required cases: `GetConfigs`, `OtapLoadScratchpad`, `OtapProcessScratchpad`, `OtapSetTargetScratchpad`, `OtapStatus`, `UploadSoftwareUpdate`, `Diagnostic`, `SyncGatewayTime`, `RenewCertificate`. The spurious `RestartGateway='restart_gateway'` case was removed.

**Why:** The spec (`docs/specs/gateway-module-contract.md`, POST /api/v1/gateways/{id}/commands) defines exactly these 9 allowed command types. The enum is now fully aligned.

**How to apply:** When checking Gateway module layers beyond Enums, verify that the request validation for the commands endpoint uses `GatewayCommandType::cases()` or its values correctly — the enum is now safe to use as the source of truth for the `in:` rule.
