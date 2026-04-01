# Command Console Module — Test Report
Date: 2026-04-01

## API Tests

### Summary
- Total: 254 tests
- Passed: 249
- Failed: 1
- Skipped: 4

### Command-Specific Tests

#### `Tests\Feature\Command\CommandConsoleTest` — PASS (46 tests)

**POST /api/v1/commands**
| Test | Result |
|------|--------|
| it requires authentication | ✅ PASS |
| it returns 403 when user lacks command.create permission | ✅ PASS |
| it superadmin can create a send_data command | ✅ PASS |
| it stores node_address as uppercase | ✅ PASS |
| it sets no_packet_id=true when include_tracking=false | ✅ PASS |
| it auto-generates request_id and correlation_id | ✅ PASS |
| it writes an outbox event atomically on create | ✅ PASS |
| it rejects missing required fields | ✅ PASS |
| it rejects invalid node_address (non-hex characters) | ✅ PASS |
| it rejects node_address exceeding 10 characters | ✅ PASS |
| it rejects packet_id that is not exactly 4 bytes | ✅ PASS |
| it requires packet_id when include_tracking=true | ✅ PASS |
| it rejects non-hex payload | ✅ PASS |
| it rejects network_id not in user accessible networks | ✅ PASS |
| it allows non-superadmin to send to their accessible networks | ✅ PASS |
| it classifies dest_ep=9 as AlarmAcknowledge | ✅ PASS |
| it classifies FFFFFFFF as NetworkMessage | ✅ PASS |
| it classifies FFFFFFFE as SinkMessage | ✅ PASS |
| it classifies 80XXXXFF as ZoneMessage | ✅ PASS |
| it classifies 80XXXXAA (starts 80, not ends FF) | ✅ PASS |
| it classifies node_address matching node_type prefix | ✅ PASS |
| it classifies area_id match as GroupMessage | ✅ PASS |
| it classifies default address as WaitingResolution | ✅ PASS |
| it AlarmAcknowledge takes priority over NetworkMessage | ✅ PASS |

**GET /api/v1/commands**
| Test | Result |
|------|--------|
| it requires authentication | ✅ PASS |
| it returns 403 when user lacks command.view permission | ✅ PASS |
| it superadmin sees all commands across all networks | ✅ PASS |
| it non-superadmin only sees commands from their networks | ✅ PASS |
| it excludes node_provisioning commands from listing | ✅ PASS |
| it returns paginated results with meta and links | ✅ PASS |
| it filters by network_id | ✅ PASS |
| it filters by processing_status | ✅ PASS |
| it filters by message_status | ✅ PASS |
| it filters by node_address case-insensitively | ✅ PASS |
| it filters by date_from and date_to | ✅ PASS |
| it returns results sorted by created_at DESC | ✅ PASS |

**POST /api/v1/commands/{command}/resend**
| Test | Result |
|------|--------|
| it returns 404 for non-existent command | ✅ PASS |
| it returns 403 when user lacks command.create permission | ✅ PASS |
| it returns 403 when user tries to resend a command from inaccessible network | ✅ PASS |
| it allows command creator to resend | ✅ PASS |
| it superadmin can resend any command | ✅ PASS |
| it returns 422 when retry_count exceeds max | ✅ PASS |
| it returns 422 when processing_status is QUEUED | ✅ PASS |
| it returns 422 when command was created by provisioning | ✅ PASS |
| it increments retry_count, resets status to PENDING | ✅ PASS |
| it writes outbox event on resend | ✅ PASS |

#### `Tests\Feature\Command\InternalCommandStatusTest` — PASS

| Test | Result |
|------|--------|
| it rejects missing X-Internal-Token header | ✅ PASS |
| it rejects wrong X-Internal-Token | ✅ PASS |
| it returns 404 for non-existent command | ✅ PASS |
| it rejects invalid processing_status | ✅ PASS |
| it updates processing_status (QUEUED, DISPATCHED, ACKED) | ✅ PASS |
| it updates processing_status to FAILED | ✅ PASS |
| it sets error_message on failure | ✅ PASS |
| it returns 409 when command is already in a terminal state | ✅ PASS |

### Pre-existing Failures (not caused by Command Console)

#### `Tests\Feature\Provisioning\StoreProvisioningBatchTest` — ❌ FAIL (1 test)

**Test:** `POST /api/v1/provisioning/batches → 201 with correct structure`

**Error:**
```
Failed asserting that an array has the key 'network'.
at tests/Feature/Provisioning/StoreProvisioningBatchTest.php:46
```

The test asserts a `network` key in the `data.primary` response but the API response does not include it. This failure is in the Provisioning module and is unrelated to the Command Console implementation.

### Full Suite Results

```
Tests:    1 failed, 4 skipped, 249 passed (1181 assertions)
Duration: 79.20s
```

**Skipped tests (4):** Located in other modules, not command-related.

---

## Frontend TypeScript Check

### Summary
- Command module errors: 0 (PASS)
- Pre-existing errors: 31 (not caused by this module)

### Command Module Files Checked

| File | Status |
|------|--------|
| `src/types/command.ts` | ✅ No errors |
| `src/api/commands.ts` | ✅ No errors |
| `src/hooks/useCommands.ts` | ✅ No errors |
| `src/hooks/useCommandPermissions.ts` | ✅ No errors |
| `src/constants/commands.ts` | ✅ No errors |
| `src/pages/commands/CommandConsolePage.tsx` | ✅ No errors |
| `src/components/ui/command.tsx` | ✅ No errors |

### Pre-existing Errors

The following 31 errors exist in files unrelated to the Command Console module:

| File | Error |
|------|-------|
| `src/components/shared/TemperatureHeatmap.tsx:15` | TS6133: 'cn' is declared but its value is never read |
| `src/components/ui/combobox.tsx:67` | TS2322: Property 'render' does not exist on Button props type |
| `src/components/ui/combobox.tsx:232` | TS2322: Type '"icon-xs"' is not assignable to valid size values |
| `src/hooks/useCompanies.ts:95` | TS2345: Argument of type `{ data: Company; }` not assignable to `SetStateAction<Company \| null>` |
| `src/hooks/useDashboard.ts:18` | TS6196: 'HeatmapBuilding' is declared but never used |
| `src/hooks/useDashboard.ts:103` | TS2304: Cannot find name 'TempBuilding' |
| `src/hooks/useFireExtinguisher.ts:112` | TS2345: 'HeatmapBuilding[]' not assignable to 'TempBuilding[]' |
| `src/mocks/handlers.nodes.ts:4` | TS2307: Cannot find module 'msw' |
| `src/mocks/handlers.nodes.ts:9` | TS7031: Binding element 'request' implicitly has 'any' type |
| `src/mocks/handlers.nodes.ts:29` | TS2339: Property 'floor' does not exist on type 'Node' |
| `src/mocks/handlers.nodes.ts:49` | TS2353: Property 'total' does not exist in type 'NodeListResponse' |
| `src/mocks/handlers.ts:10` | TS6133: 'MOCK_HEATMAP' declared but never read |
| `src/mocks/handlers.ts:15` | TS6196: 'HeatmapBuilding' declared but never used |
| `src/mocks/nodesData.ts:13` | TS2353: Property 'floor' does not exist on type 'Node' (×8 occurrences across lines 13–112) |
| `src/mocks/nodesData.ts:104` | TS2322: Type 'null' not assignable to type 'string' |
| `src/pages/auth/SetPasswordPage.tsx:11` | TS2307: Cannot find module '@/hooks/useSetPassword' |
| `src/pages/modules/FireExtinguisherPage.tsx:213` | TS2322: Type 'string[]' not assignable to type 'FaultType[]' |
| `src/pages/networks/NetworksPage.tsx:185` | TS2339: Property 'ACTIONS' does not exist on UI_STRINGS constant |
| `src/pages/networks/NetworksPage.tsx:346` | TS6196: 'NetworkFormDialogPlaceholderProps' declared but never used |
| `src/pages/node-types/NodeTypesPage.tsx:47` | TS6133: 'setPerPage' declared but never read |
| `src/pages/node-types/NodeTypesPage.tsx:191` | TS2339: Property 'ACTIONS' does not exist on UI_STRINGS constant |

---

## Overall Status

✅ PASS (Command Console module — all tests and type checks pass)

The single API test failure (`StoreProvisioningBatchTest`) and all 31 TypeScript errors are pre-existing issues in the Provisioning and other modules, entirely unrelated to the Command Console implementation.

---

## Notes

1. **API tests**: All 54 Command Console tests pass (46 in `CommandConsoleTest` + 8 in `InternalCommandStatusTest`), covering authentication, authorization, validation, message classification, filtering, pagination, resend logic, outbox atomicity, and internal status updates.

2. **Pre-existing provisioning failure**: `StoreProvisioningBatchTest` fails because the API response for `POST /api/v1/provisioning/batches` does not include a `network` key in `data.primary`. This was present before the Command Console module was added.

3. **Frontend TypeScript errors**: All 31 TypeScript errors are in mock data files (`src/mocks/`), dashboard hooks, fire extinguisher page, combobox UI component, and a missing `@/hooks/useSetPassword` hook — none relate to Command Console.

4. **Outbox pattern**: The command creation and resend flows correctly write commands and outbox events within a single DB transaction, as verified by dedicated atomicity tests.

5. **RBAC enforcement**: The `command.view` and `command.create` permission gates are fully tested, including network-scoped access control for non-superadmin users.
