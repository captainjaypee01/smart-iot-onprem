---
name: GatewayDiagnosticType and GatewayServiceName are not in the gateway spec
description: Two Gateway enums exist in code with no corresponding spec section; cannot be validated without spec clarification
type: project
---

`GatewayDiagnosticType` and `GatewayServiceName` are present in `api/app/Enums/` but are not mentioned anywhere in `docs/specs/gateway-module-contract.md`. Their values cannot be confirmed or denied as correct without a spec anchor.

**Why:** The spec details the Diagnostic command type but does not describe the payload structure that would use these enums. They are likely intended for a sub-payload of `diagnostic` commands but this is unspecified.

**How to apply:** When validating later layers (controllers, actions, DTOs), check whether these enums are referenced. If they are used in request validation or response construction, flag it as a spec deviation until the spec is updated with their definitions.
