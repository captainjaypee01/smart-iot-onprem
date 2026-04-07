# Gateway Module — Shared Contract

Both API and frontend must treat this as immutable. Update this doc when the contract changes.

---

## Overview

The Gateway module manages Wirepas gateway devices that bridge IoT node networks to the backend. A gateway is a physical device identified within the platform by a `gateway_id` — a human-readable composite identifier formed by concatenating a per-network prefix with an incrementing `sink_id` (e.g. `ABC123_01`). Each gateway belongs to exactly one network.

Gateway status (`online`, `offline`, `unknown`) is a derived value, not stored in the database. A scheduled job compares each gateway's `last_seen_at` timestamp against a configurable threshold (default: 10 minutes) to compute status at query time. `last_seen_at` is updated by a separate internal IoT service endpoint every time a MQTT message arrives from that gateway.

This module is **internal platform personnel only** — not accessible to company/tenant users. Access is granted via role assignment (Platform Admin, Platform Support, or any custom internal role with gateway.* permissions). Company-scoped roles never receive gateway.* permission keys, and the `gateway_settings` feature (group_order 99) is excluded from their feature set. Superadmins bypass all policy checks automatically.

This module introduces a `gateway_prefix` column on the `networks` table (added via a separate migration). All gateways within the same network share the same prefix. The prefix is supplied by the operator when creating the first gateway for a network; subsequent gateways inherit the prefix automatically.

The module integrates with the existing command module: the `gateway.send_command` permission gates the ability to send a command payload to a specific gateway via the `POST /api/v1/gateways/{id}/commands` endpoint. Commands written by this endpoint write to the shared `commands` table with an appropriate `type` value and use the existing outbox/dispatch pipeline. The `reqId` field in the MQTT payload is the `request_id` value from the `commands` record — no separate ID generation is required.

---

## Actors & Permissions

| Permission key | Who holds it | What it gates |
|----------------|-------------|---------------|
| `gateway.view` | Platform Admin, Platform Support (+ any custom internal role) | List gateways (`GET /api/v1/gateways`), view single gateway (`GET /api/v1/gateways/{id}`) |
| `gateway.create` | Platform Admin | Create a gateway (`POST /api/v1/gateways`) |
| `gateway.update` | Platform Admin | Edit a gateway's name/notes, toggle test mode (`PATCH /api/v1/gateways/{id}`) |
| `gateway.delete` | Platform Admin | Soft-delete a gateway (`DELETE /api/v1/gateways/{id}`) |
| `gateway.send_command` | Platform Admin | Send a command payload to a gateway (`POST /api/v1/gateways/{id}/commands`) |

All five keys are seeded under `module = 'gateway'` in `PermissionSeeder.php`. Platform Admin receives all five. Platform Support receives `gateway.view` only.

**Authorization model:** `GatewayPolicy` checks only `hasPermission('gateway.*')` — no `is_superadmin` flag check. Superadmins bypass the policy automatically via Laravel's built-in before-hook. Company/tenant roles (Company Admin, Zone Manager, Field Technician, Viewer, etc.) never have gateway.* keys assigned.

**Frontend routing:** Gateway routes are protected by `FeatureRoute featureKey="gateway_settings"`. The `gateway_settings` feature has `group_order = 99` and is only included in internal platform roles' feature sets (not tenant-scoped roles). Routes are **not** inside `SuperadminOutlet` so that non-superadmin platform personnel with the correct role can access them.

---

## Data Model

### `networks` table — added column (new migration)

A new migration adds one column to the existing `networks` table:

```
networks (existing table — one column added)
└── gateway_prefix    string(10), nullable, unique
                      Uppercase alphanumeric, no spaces, max 10 chars.
                      e.g. "ABC123"
                      NULL until the first gateway is created for this network.
                      Set once on first gateway creation; immutable thereafter.
```

**Index:** `(gateway_prefix)` — unique index (enforced at DB level).

**Constraint note:** `gateway_prefix` is globally unique across all networks. Two networks cannot share the same prefix.

---

### `gateways` table (new table)

```
gateways
├── id                    bigint unsigned, PK (auto-increment)
├── network_id            bigint unsigned, NOT NULL
│                         FK → networks.id, ON DELETE RESTRICT
│                         (cannot delete network if gateways exist)
├── gateway_id            string(20), NOT NULL, UNIQUE
│                         Composite identifier: "{network_prefix}_{sink_id}"
│                         e.g. "ABC123_01", "ABC123_02"
│                         Auto-generated. Never editable after creation.
├── sink_id               string(2), NOT NULL
│                         Zero-padded 2-digit incremental integer per network.
│                         e.g. "01", "02", ..., "99"
│                         Stored uppercase. Derived from count of existing
│                         gateways (including soft-deleted) for the network.
├── name                  string(255), NOT NULL
│                         Human-readable label e.g. "Gateway Floor 1"
├── description           text, nullable
│                         Optional notes / installation remarks.
├── is_test_mode          boolean, NOT NULL, default false
│                         When true, gateway is in test/diagnostic mode.
│                         Toggled via PATCH endpoint (gateway.update).
├── last_seen_at          timestamp, nullable
│                         Updated by the IoT service via internal endpoint
│                         every time a message arrives from this gateway.
│                         NULL = never connected.
├── deleted_at            timestamp, nullable
│                         Soft delete. NULL = active. Non-null = deleted.
└── timestamps            (created_at, updated_at)
```

**Indexes:**

| Index | Columns | Type |
|-------|---------|------|
| Primary key | `id` | B-tree |
| Unique | `gateway_id` | B-tree |
| Index | `network_id` | B-tree |
| Index | `sink_id` | B-tree (scoped queries per network) |
| Index | `last_seen_at` | B-tree (status derivation job) |
| Soft-delete | `deleted_at` | B-tree |

**Foreign keys:**

| Column | References | On Delete |
|--------|-----------|-----------|
| `network_id` | `networks.id` | RESTRICT — prevents deleting a network that has gateways |

**No foreign key on `last_seen_at`** — it is a raw timestamp updated by an internal service endpoint.

---

### gateway_id Generation Logic

The `gateway_id` is auto-generated by the API on gateway creation. It is never accepted from the request.

**Algorithm:**

1. Look up `networks.gateway_prefix` for the given `network_id`.
2. If `gateway_prefix` is `NULL` (first gateway for this network):
   - Accept `gateway_prefix` from the request payload (required field when network has no prefix yet).
   - Validate: uppercase alphanumeric, max 10 chars, globally unique across all networks.
   - Write `gateway_prefix` to `networks.gateway_prefix` in the same DB transaction as the gateway record.
3. If `gateway_prefix` is already set, do not accept `gateway_prefix` from the request (ignore if provided). Use the network's existing prefix.
4. Count all existing `gateways` records for this `network_id` — including soft-deleted rows — to determine the next `sink_id`.
   - `sink_id = count + 1`, zero-padded to 2 digits. e.g. count=0 → `"01"`, count=1 → `"02"`.
5. Concatenate: `gateway_id = "{gateway_prefix}_{sink_id}"`.
6. Write both `gateway_id` and `sink_id` to the record.

**Why include soft-deleted rows in the count:** Reusing a `sink_id` from a deleted gateway would create a new gateway with the same `gateway_id` as a historic (soft-deleted) record. Since `gateway_id` appears in MQTT topics and command history, reuse would corrupt audit trails. The count must include deleted rows to guarantee `gateway_id` uniqueness over the lifetime of the network.

---

### Derived Gateway Status

`status` is NOT stored in the database. It is computed at query time using the following rules:

| Condition | Derived status |
|-----------|---------------|
| `last_seen_at IS NULL` | `unknown` |
| `last_seen_at >= NOW() - INTERVAL` | `online` |
| `last_seen_at < NOW() - INTERVAL` | `offline` |

The threshold interval is defined by a configurable constant, recommended default: `10 minutes`. Define as `GATEWAY_ONLINE_THRESHOLD_MINUTES` in an environment config or `config/iot.php`. The API resource computes and exposes `status` as a string field on every response.

**Badge colours (frontend convention):**

| Status | Badge colour |
|--------|-------------|
| `online` | Green |
| `offline` | Red |
| `unknown` | Grey |

---

### Eloquent Model Notes

- **Casts:** `is_test_mode` → `boolean`, `last_seen_at` → `datetime`, `deleted_at` → `datetime`.
- **Soft deletes:** Uses Laravel `SoftDeletes` trait. All queries use `withTrashed()` only when explicitly needed (e.g. `sink_id` counter for new gateway creation; the counter query must call `withTrashed()`).
- **Appended attribute:** `status` is a computed attribute appended to every resource response — derived from `last_seen_at`. Do not add a `status` column to the DB.
- **Scopes:** `scopeForNetwork($networkId)` — `WHERE network_id = $networkId AND deleted_at IS NULL`.
- **No `id` type change** — `id` is a standard auto-increment bigint.

---

## API Endpoints

### GET /api/v1/gateways

List all gateways with server-side pagination.

**Auth:** Sanctum cookie session + `is_superadmin = true` + `gateway.view` permission.

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `per_page` | integer | Items per page, 1–100 (default: 15) |
| `network_id` | integer | Filter by network |
| `status` | string | Filter by derived status: `online`, `offline`, `unknown` |

**Note on `status` filter:** Because status is derived, filtering by `status` requires the API to translate the filter into a `last_seen_at` range query before executing. Do not attempt to filter on a non-existent `status` column.

- `online` → `last_seen_at >= NOW() - threshold`
- `offline` → `last_seen_at IS NOT NULL AND last_seen_at < NOW() - threshold`
- `unknown` → `last_seen_at IS NULL`

**Default sort:** `created_at DESC`.

**Success response:** `200 OK`

```json
{
  "data": [
    {
      "id": 1,
      "gateway_id": "ABC123_01",
      "sink_id": "01",
      "network": { "id": 3, "name": "Building A", "network_address": "A1B2C3" },
      "name": "Gateway Floor 1",
      "description": "Installed near lift lobby",
      "is_test_mode": false,
      "status": "online",
      "last_seen_at": "2026-04-06T08:55:00+00:00",
      "created_at": "2026-01-10T09:00:00+00:00",
      "updated_at": "2026-04-06T08:55:00+00:00"
    }
  ],
  "meta": { "current_page": 1, "last_page": 2, "per_page": 15, "total": 18 },
  "links": { "first": "...", "next": "...", "prev": null, "last": "..." }
}
```

**Error responses:**

| HTTP | Condition |
|------|-----------|
| 403 | User is not superadmin or lacks `gateway.view` |

**Resource class:** `GatewayResource`

---

### GET /api/v1/gateways/{id}

Retrieve a single gateway.

**Auth:** Sanctum cookie session + `is_superadmin = true` + `gateway.view` permission.

**URL parameter:** `id` — integer gateway ID.

**Success response:** `200 OK` — `GatewayResource` shape (same as list item above, single `data` object).

**Error responses:**

| HTTP | Condition |
|------|-----------|
| 403 | User is not superadmin or lacks `gateway.view` |
| 404 | Gateway not found (or soft-deleted) |

---

### POST /api/v1/gateways

Create a new gateway.

**Auth:** Sanctum cookie session + `is_superadmin = true` + `gateway.create` permission.

**Request body:**

```json
{
  "network_id": 3,
  "name": "Gateway Floor 1",
  "description": "Installed near lift lobby",
  "gateway_prefix": "ABC123"
}
```

**Validation rules:**

| Field | Rule |
|-------|------|
| `network_id` | required, integer, exists:networks,id |
| `name` | required, string, max:255 |
| `description` | nullable, string, max:1000 |
| `gateway_prefix` | required_if: network has no existing gateway_prefix; nullable otherwise. When provided: string, max:10, regex:`/^[A-Z0-9]+$/` (uppercase alphanumeric only), unique:networks,gateway_prefix |

**Conditional `gateway_prefix` logic (in `CreateGatewayAction`):**

- If `networks.gateway_prefix` for the given `network_id` is NULL: `gateway_prefix` is required and must be provided.
- If `networks.gateway_prefix` is already set: the field is silently ignored even if provided. The existing prefix is used.
- Validation error returned if `gateway_prefix` is missing when required: `422 { "errors": { "gateway_prefix": ["The gateway prefix is required for the first gateway in this network."] } }`.

**What the action does (`CreateGatewayAction`):**

1. Loads the network by `network_id` — 404 if not found.
2. Determines whether to write `gateway_prefix` to the network (only if NULL).
3. Counts all gateways for the network **including soft-deleted** to derive `sink_id`.
4. Constructs `gateway_id = "{prefix}_{sink_id}"`.
5. Wraps steps 2, 4, and 6 in a single DB transaction to prevent race conditions:
   - Updates `networks.gateway_prefix` (if applicable).
   - Creates the `gateways` record with `is_test_mode = false`, `last_seen_at = NULL`.
6. Returns the created gateway.

**Success response:** `201 Created` — `GatewayResource` shape.

**Error responses:**

| HTTP | Condition |
|------|-----------|
| 403 | User is not superadmin or lacks `gateway.create` |
| 404 | Network not found |
| 422 | Validation failure |
| 422 | `gateway_prefix` missing when required (first gateway in network) |
| 409 | `gateway_prefix` already taken by another network |

---

### PATCH /api/v1/gateways/{id}

Update a gateway's editable fields. `gateway_id`, `sink_id`, and `network_id` are not editable after creation.

**Auth:** Sanctum cookie session + `is_superadmin = true` + `gateway.update` permission.

**Request body (all fields optional — partial update):**

```json
{
  "name": "Gateway Floor 2",
  "description": "Relocated to stairwell",
  "is_test_mode": true
}
```

**Validation rules:**

| Field | Rule |
|-------|------|
| `name` | sometimes, string, max:255 |
| `description` | sometimes, nullable, string, max:1000 |
| `is_test_mode` | sometimes, boolean |

**Note:** `is_test_mode` toggle uses the same endpoint. No separate toggle endpoint is needed — this PATCH handles it. The `gateway.update` permission gates this action.

**What the action does (`UpdateGatewayAction`):**

1. Loads gateway by `id` — 404 if not found or soft-deleted.
2. Applies only the fields present in the validated payload.
3. Saves the record.
4. Returns the updated gateway.

**Success response:** `200 OK` — `GatewayResource` shape.

**Error responses:**

| HTTP | Condition |
|------|-----------|
| 403 | User is not superadmin or lacks `gateway.update` |
| 404 | Gateway not found or soft-deleted |
| 422 | Validation failure |

---

### DELETE /api/v1/gateways/{id}

Soft-delete a gateway. Sets `deleted_at` timestamp. The record remains in the database for audit trail and `sink_id` counter integrity.

**Auth:** Sanctum cookie session + `is_superadmin = true` + `gateway.delete` permission.

**No request body.**

**What the action does (`DeleteGatewayAction`):**

1. Loads gateway by `id` — 404 if not found or already soft-deleted.
2. Calls `$gateway->delete()` (which sets `deleted_at` via `SoftDeletes`).
3. Returns `204 No Content`.

**Note:** The `networks.gateway_prefix` column is NOT cleared when all gateways for a network are deleted. The prefix remains assigned to that network permanently. If a new gateway is later created for the same network, it reuses the existing prefix and continues incrementing `sink_id`.

**Success response:** `204 No Content`

**Error responses:**

| HTTP | Condition |
|------|-----------|
| 403 | User is not superadmin or lacks `gateway.delete` |
| 404 | Gateway not found or already soft-deleted |

---

### POST /api/v1/gateways/{id}/commands

Send a command payload to a specific gateway. This writes to the shared `commands` table and enters the existing outbox/dispatch pipeline.

**Auth:** Sanctum cookie session + `is_superadmin = true` + `gateway.send_command` permission.

**URL parameter:** `id` — integer gateway ID.

**Request body:**

```json
{
  "type": "get_configs",
  "payload": "DEADBEEF"
}
```

**Validation rules:**

| Field | Rule |
|-------|------|
| `type` | required, string, in:`get_configs`, `otap_load_scratchpad`, `otap_process_scratchpad`, `otap_set_target_scratchpad`, `otap_status`, `upload_software_update`, `diagnostic`, `sync_gateway_time`, `renew_certificate` |
| `payload` | nullable, string, regex:`/^[0-9A-Fa-f]*$/` (hex characters only) |

**Allowed command types for gateways:**

| Type key | Description |
|----------|-------------|
| `get_configs` | Request gateway configuration |
| `otap_load_scratchpad` | Load OTAP scratchpad |
| `otap_process_scratchpad` | Process OTAP scratchpad |
| `otap_set_target_scratchpad` | Set OTAP target scratchpad |
| `otap_status` | Query OTAP status |
| `upload_software_update` | Upload a software update |
| `diagnostic` | Run a diagnostic |
| `sync_gateway_time` | Synchronise gateway clock |
| `renew_certificate` | Renew gateway TLS certificate |

**MQTT payload shape (outbox event carries this for IoT dispatcher):**

The outbox event payload is `{ "command_id": "<ULID>" }`. The IoT dispatcher resolves the full command from the DB and constructs the MQTT message. The `reqId` field in the MQTT message is set to the `request_id` value from the `commands` record (same value, different JSON field name).

**What the action does (`CreateGatewayCommandAction`):**

1. Loads gateway by `id` — 404 if not found or soft-deleted.
2. Resolves `network_address` from `gateway.network.network_address` (via eager-loaded relationship). This is the MQTT routing address — never stored redundantly on the gateway.
3. Sets `node_address` on the command to `gateway.gateway_id` (the gateway's identifier used in MQTT topics).
4. Auto-generates `request_id` (same logic as Command Console: `random_int(100000000, 4294967295)`).
5. Auto-generates `correlation_id` (`Str::uuid()`).
6. Sets `message_status = 7` (Gateway Responded — per the message classification rules in the command spec, all gateway command types receive this classification on creation).
7. Sets `processing_status = 1` (Pending).
8. Sets `created_by = auth()->id()`.
9. Writes the `commands` record and an `outbox_events` record (type: `command.gateway.created`, payload: `{ "command_id": "<ULID>" }`) in a single DB transaction.
10. Returns the created command using `CommandResource`.

**Command record field mapping:**

| `commands` column | Value |
|-------------------|-------|
| `type` | Request `type` field (e.g. `"get_configs"`) |
| `network_id` | `gateway.network_id` |
| `node_address` | `gateway.gateway_id` (e.g. `"ABC123_01"`) |
| `request_id` | Auto-generated large BIGINT |
| `payload` | Request `payload` field (hex string, nullable) |
| `processing_status` | `1` (Pending) |
| `message_status` | `7` (Gateway Responded) |
| `source_ep` | `NULL` |
| `dest_ep` | `NULL` |
| `no_packet_id` | `true` |
| `packet_id` | `NULL` |
| `created_by` | `auth()->id()` |
| `correlation_id` | `Str::uuid()` |

**Success response:** `201 Created` — `CommandResource` shape (see command-module-contract.md).

**Error responses:**

| HTTP | Condition |
|------|-----------|
| 403 | User is not superadmin or lacks `gateway.send_command` |
| 404 | Gateway not found or soft-deleted |
| 422 | Validation failure — invalid `type` or `payload` |

---

### PATCH /api/v1/internal/gateways/{id}/last-seen

**Internal endpoint.** Called by the IoT service every time a message arrives from a gateway. Updates `last_seen_at` to the current timestamp. Requires `X-Internal-Token` header. Not accessible via Sanctum.

**Auth:** `X-Internal-Token` header validation only. No user session required.

**URL parameter:** `id` — integer gateway ID.

**No request body.** The server uses `now()` as the `last_seen_at` value.

**What the action does (`UpdateGatewayLastSeenAction`):**

1. Validates `X-Internal-Token` header.
2. Loads gateway by `id` — 404 if not found. Soft-deleted gateways: if the gateway is soft-deleted, the IoT service should still be able to update `last_seen_at` (use `withTrashed()` on lookup). The gateway may have been deleted from the platform UI while still emitting MQTT heartbeats.
3. Updates `last_seen_at = now()`.
4. Returns `200 OK` with minimal payload.

**Success response:** `200 OK`

```json
{
  "data": {
    "id": 1,
    "gateway_id": "ABC123_01",
    "last_seen_at": "2026-04-06T09:00:00+00:00"
  }
}
```

**Error responses:**

| HTTP | Condition |
|------|-----------|
| 401 | Missing or invalid `X-Internal-Token` |
| 404 | Gateway not found (including soft-deleted) |

---

## Scheduled Job: Gateway Status Derivation

Gateway status is derived at query time — no job needs to write a status value. However, a scheduled job (`MarkOfflineGatewaysJob`) may be added later to emit alerts when a gateway transitions to `offline`. This is out of scope for the current spec.

The `last_seen_at` field is the only stored value required. The derivation logic (applied in `GatewayResource`) is:

```
threshold = config('iot.gateway_online_threshold_minutes', 10)

if last_seen_at === null         → status = "unknown"
if last_seen_at >= now - threshold → status = "online"
else                             → status = "offline"
```

This logic lives in a single place: the `GatewayResource` class (or a helper method it delegates to). It must not be duplicated in controllers or the model.

---

## Frontend Specification

### Route

`/gateways` — Gateway list page.
`/gateways/{id}` — Gateway detail page (optional, see below).

**Feature gate:** The sidebar link and route require `gateway.view` permission (via `canViewGateways()` helper in `useGatewayPermissions()`). This module is superadmin-only — the permission gate also implicitly enforces `is_superadmin`. If a non-superadmin somehow reaches the route, the API returns 403 and the frontend should handle this with a generic 403 redirect.

---

### Permission Helpers (`useGatewayPermissions()`)

```
canViewGateways()       → hasPermission("gateway.view")
canCreateGateway()      → hasPermission("gateway.create")
canUpdateGateway()      → hasPermission("gateway.update")
canDeleteGateway()      → hasPermission("gateway.delete")
canSendGatewayCommand() → hasPermission("gateway.send_command")
```

---

### GatewayListPage (`/gateways`)

#### Data fetching

- Gateway list: fetched via `GET /api/v1/gateways` with pagination and filter state via `useGateways()` hook.
- Networks dropdown for filter: fetched once at page level via `GET /api/v1/networks/options`. Passed as props to filter components and the create/edit form dialogs to avoid duplicate API calls.

#### Filters (above table)

- Network dropdown (options from networks options endpoint, lifted to page level)
- Status dropdown: All / Online / Offline / Unknown

Filter state is local to the page. Changing any filter resets to page 1.

---

### Gateway List Table

Uses `DataTableServer`.

**Columns:**

| Column | Source field | Notes |
|--------|-------------|-------|
| Gateway ID | `gateway_id` | Monospace font |
| Name | `name` | |
| Network | `network.name` | |
| Status | `status` | Badge with colour (green/red/grey per status) |
| Test Mode | `is_test_mode` | Badge: "Test Mode" (amber) when true, empty when false |
| Last Seen | `last_seen_at` | Formatted as local datetime; "Never" if null |
| Actions | — | Edit button, Delete button, Send Command button |

**Row actions:**

| Action | Visible condition |
|--------|-----------------|
| Edit | `canUpdateGateway()` |
| Delete | `canDeleteGateway()` |
| Send Command | `canSendGatewayCommand()` |

---

### GatewayFormDialog (Create / Edit)

Shared dialog used for both create and edit.

**Create mode fields:**

| Field | Component | Validation |
|-------|-----------|------------|
| Network | Select/dropdown | Required. Options from `GET /api/v1/networks/options` (lifted to page). |
| Name | Text input | Required. Max 255 chars. |
| Description | Textarea | Optional. Max 1000 chars. |
| Gateway Prefix | Text input | Conditionally required. Shown only when the selected network has no existing `gateway_prefix`. Uppercase alphanumeric, max 10 chars. Auto-uppercased on blur. |

**Prefix field visibility logic:** When the user selects a network from the dropdown, the frontend must determine whether that network already has a `gateway_prefix`. This can be resolved by having the `GET /api/v1/networks/options` endpoint return a `gateway_prefix` field (nullable) per network option. If `gateway_prefix` is non-null, hide the prefix field and show a read-only hint: "Prefix: {gateway_prefix} (auto-assigned)". If `gateway_prefix` is null, show the prefix input as required.

**Edit mode fields:**

| Field | Component | Notes |
|-------|-----------|-------|
| Name | Text input | Required. Editable. |
| Description | Textarea | Optional. Editable. |
| Test Mode | Toggle/switch | Editable. |

`gateway_id`, `sink_id`, and `network` are read-only and displayed as informational labels in edit mode — not sent in the PATCH payload.

**Submit behaviour (both modes):**
- Submit button: disabled + spinner while request is in-flight.
- On create success: `toast.success(GATEWAY_STRINGS.SUCCESS_CREATED)`, close dialog, refresh list.
- On edit success: `toast.success(GATEWAY_STRINGS.SUCCESS_UPDATED)`, close dialog, refresh list.
- On error: `toast.error(errorMessage)`, keep field values intact.

---

### Delete Confirmation Dialog

- Triggered by the Delete row action.
- Shows: "Are you sure you want to delete gateway {gateway_id} — {name}? This action cannot be undone."
- Two buttons: Cancel (closes dialog) and Confirm Delete (destructive).
- Confirm button: disabled + spinner while request is in-flight.
- On success: `toast.success(GATEWAY_STRINGS.SUCCESS_DELETED)`, close dialog, refresh list.
- On error: `toast.error(errorMessage)`.

---

### SendGatewayCommandDialog

Opened from the Send Command row action.

**Fields:**

| Field | Component | Validation |
|-------|-----------|------------|
| Command Type | Select/dropdown | Required. Options from the allowed types list (see API section). |
| Payload | Text input | Optional. Hex characters only. |

**Available command type options (constant map `GATEWAY_COMMAND_TYPE_OPTIONS`):**

```
get_configs              → "Get Configs"
otap_load_scratchpad     → "Load OTAP Scratchpad"
otap_process_scratchpad  → "Process OTAP Scratchpad"
otap_set_target_scratchpad → "Set OTAP Target Scratchpad"
otap_status              → "OTAP Status"
upload_software_update   → "Upload Software Update"
diagnostic               → "Diagnostic"
sync_gateway_time        → "Sync Gateway Time"
renew_certificate        → "Renew Certificate"
```

**Submit behaviour:**
- Submit button: disabled + spinner while request is in-flight.
- On success: `toast.success(GATEWAY_STRINGS.SUCCESS_COMMAND_SENT)`, close dialog.
- On error: `toast.error(errorMessage)`.

---

### String Constants (`GATEWAY_STRINGS`)

Define in `src/constants/gatewayStrings.ts`:

```
GATEWAY_STRINGS.PAGE_TITLE               = "Gateways"
GATEWAY_STRINGS.BTN_ADD_GATEWAY          = "Add Gateway"
GATEWAY_STRINGS.LABEL_GATEWAY_ID         = "Gateway ID"
GATEWAY_STRINGS.LABEL_SINK_ID            = "Sink ID"
GATEWAY_STRINGS.LABEL_NAME               = "Name"
GATEWAY_STRINGS.LABEL_NETWORK            = "Network"
GATEWAY_STRINGS.LABEL_DESCRIPTION        = "Description"
GATEWAY_STRINGS.LABEL_PREFIX             = "Gateway Prefix"
GATEWAY_STRINGS.LABEL_TEST_MODE         = "Test Mode"
GATEWAY_STRINGS.LABEL_STATUS             = "Status"
GATEWAY_STRINGS.LABEL_LAST_SEEN          = "Last Seen"
GATEWAY_STRINGS.LABEL_COMMAND_TYPE       = "Command Type"
GATEWAY_STRINGS.LABEL_PAYLOAD            = "Payload"
GATEWAY_STRINGS.STATUS_ONLINE            = "Online"
GATEWAY_STRINGS.STATUS_OFFLINE           = "Offline"
GATEWAY_STRINGS.STATUS_UNKNOWN           = "Unknown"
GATEWAY_STRINGS.NEVER_CONNECTED         = "Never"
GATEWAY_STRINGS.TEST_MODE_BADGE          = "Test Mode"
GATEWAY_STRINGS.PREFIX_AUTO_HINT         = "Prefix: {prefix} (auto-assigned)"
GATEWAY_STRINGS.BTN_SEND_COMMAND         = "Send Command"
GATEWAY_STRINGS.BTN_SENDING              = "Sending..."
GATEWAY_STRINGS.BTN_EDIT                 = "Edit"
GATEWAY_STRINGS.BTN_DELETE               = "Delete"
GATEWAY_STRINGS.BTN_CONFIRM_DELETE       = "Confirm Delete"
GATEWAY_STRINGS.BTN_CANCEL              = "Cancel"
GATEWAY_STRINGS.DIALOG_DELETE_TITLE      = "Delete Gateway"
GATEWAY_STRINGS.DIALOG_SEND_CMD_TITLE    = "Send Gateway Command"
GATEWAY_STRINGS.SUCCESS_CREATED          = "Gateway created successfully"
GATEWAY_STRINGS.SUCCESS_UPDATED          = "Gateway updated successfully"
GATEWAY_STRINGS.SUCCESS_DELETED          = "Gateway deleted successfully"
GATEWAY_STRINGS.SUCCESS_COMMAND_SENT     = "Command sent to gateway"
GATEWAY_STRINGS.EMPTY_LIST               = "No gateways found"
GATEWAY_STRINGS.ERROR_LOAD_FAILED        = "Failed to load gateways. Please try again."
```

---

### Loading, Empty, and Error States

- **Loading:** Skeleton rows in `DataTableServer`.
- **Empty:** `GATEWAY_STRINGS.EMPTY_LIST` message.
- **Error:** `GATEWAY_STRINGS.ERROR_LOAD_FAILED` with a retry button.
- **Dialogs — loading:** Submit button disabled with spinner. No field-level skeleton needed in dialogs.
- **Dialogs — error:** API error message displayed via `toast.error`. Fields remain populated.

---

### TypeScript Types (`src/types/gateway.ts`)

```ts
export type GatewayStatus = "online" | "offline" | "unknown";

export type GatewayCommandType =
  | "get_configs"
  | "otap_load_scratchpad"
  | "otap_process_scratchpad"
  | "otap_set_target_scratchpad"
  | "otap_status"
  | "upload_software_update"
  | "diagnostic"
  | "sync_gateway_time"
  | "renew_certificate";

export interface GatewayNetworkSummary {
  id: number;
  name: string;
  network_address: string;
}

export interface Gateway {
  id: number;
  gateway_id: string;
  sink_id: string;
  network: GatewayNetworkSummary;
  name: string;
  description: string | null;
  is_test_mode: boolean;
  status: GatewayStatus;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GatewayListMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CreateGatewayPayload {
  network_id: number;
  name: string;
  description?: string | null;
  gateway_prefix?: string;
}

export interface UpdateGatewayPayload {
  name?: string;
  description?: string | null;
  is_test_mode?: boolean;
}

export interface SendGatewayCommandPayload {
  type: GatewayCommandType;
  payload?: string | null;
}
```

---

## Event & Async Flows

### Gateway Last-Seen Update Flow

```
MQTT message arrives at IoT service from gateway
    → IoT service identifies gateway_id from MQTT topic
    → IoT service calls PATCH /api/v1/internal/gateways/{id}/last-seen
        (X-Internal-Token required)
    → API updates gateways.last_seen_at = now()
    → Status is re-derived on next API read (no event emitted)
```

### Gateway Command Flow

```
Frontend → POST /api/v1/gateways/{id}/commands
    → API: CreateGatewayCommandAction
        → Writes commands + outbox_events in ONE DB transaction
            (outbox event type: "command.gateway.created")
    → Outbox publisher reads outbox_events
        → Publishes to Redis Streams
    → IoT Dispatcher consumes Redis Stream
        → Resolves command from DB (gets gateway_id, network_address, type, payload)
        → Publishes to Wirepas topic:
            gw-request/{type}/{gateway_id}
          (protobuf payload — not JSON)
    → Wirepas gateway responds on:
            gw-response/{type}/{gateway_id}
    → IoT Ack Listener receives response
        → Calls PATCH /api/v1/internal/commands/{id}/status
            with processing_status=3, message_status=7 (Gateway Responded)
    → API updates command status
    → Frontend polls or refreshes command history to reflect new status
```

**Note on MQTT topic construction for gateway commands:**

The IoT dispatcher uses `gateway_id` as the `<gw-id>` segment in the Wirepas `gw-request/*` topic. The `<sink-id>` segment (used in some Wirepas topics) corresponds to `gateways.sink_id`. The dispatcher must resolve both from the `commands` record — `node_address` stores `gateway_id`; the network and gateway records must be loaded to get `sink_id`. This resolution logic lives entirely in the IoT service, not the API.

---

## Authorization Matrix

| Action | Superadmin | Any other role |
|--------|-----------|---------------|
| `gateway.view` — List / Get | Allowed | Denied (403) |
| `gateway.create` — Create gateway | Allowed | Denied (403) |
| `gateway.update` — Edit / Toggle test mode | Allowed | Denied (403) |
| `gateway.delete` — Soft-delete | Allowed | Denied (403) |
| `gateway.send_command` — Send command | Allowed | Denied (403) |
| Internal: last-seen update | `X-Internal-Token` only | N/A |

All gateway endpoints enforce `is_superadmin = true` at the policy/middleware level before checking individual permission keys. A superadmin who has been stripped of specific gateway permission keys should still be denied those specific actions — but in practice, superadmins bypass permission checks per the project's standard rule. This is consistent with how the Node Provisioning and Network modules are implemented.

---

## Networks Options Endpoint — Required Extension

The existing `GET /api/v1/networks/options` endpoint must be extended to include a `gateway_prefix` field per network option. This is required for the frontend to determine whether to show the prefix input field in the Create Gateway dialog.

**Extended option shape:**

```json
{
  "id": 3,
  "name": "Building A",
  "gateway_prefix": "ABC123"
}
```

`gateway_prefix` is `null` if no gateway has been created for this network yet.

This extension touches the Network module's `NetworkOptionResource` class. It is a non-breaking additive change (new nullable field). No version bump required.

---

## Out of Scope

- Gateway alert / notification flow when a gateway transitions to `offline` — the `MarkOfflineGatewaysJob` is mentioned as a future addition and is not specified here.
- Gateway detail page (`/gateways/{id}`) beyond the list view — the route is reserved but the spec does not define a detail view. Implement only the list page.
- OTAP firmware file upload via the platform UI — `upload_software_update` is included as a command type but file management is not specified here.
- Gateway configuration editing via the platform (e.g. `set_config` Wirepas command) — not included in the allowed command types.
- Multi-sink gateways (a single physical gateway with multiple sinks) — the current model assumes one sink per gateway record. Multi-sink support is a future concern.
- Role-based access for non-superadmin users — this module is superadmin-only. Delegating gateway access is a future product decision.
- Gateway metrics / uptime reporting — the `last_seen_at` timestamp is available but no aggregation or reporting UI is specified.

---

## Open Questions

1. **`GET /api/v1/networks/options` — who owns the extension?** The gateway module requires adding `gateway_prefix` to the networks options response. This touches the Network module's resource class. The gateway spec assumes this as a prerequisite — confirm with the Network module owner before implementation.

2. **Threshold configurability at runtime:** The `GATEWAY_ONLINE_THRESHOLD_MINUTES` is defined as a config value. Should operators be able to adjust this per-network (stored on `networks` table) or is a single global value sufficient? Current spec assumes global. Escalate to product if per-network thresholds are needed.

3. **`sink_id` counter with concurrent creation:** Two simultaneous gateway creation requests for the same network could compute the same `sink_id`. The DB transaction with a row-level lock on the network record (e.g. `SELECT FOR UPDATE` on `networks` when computing the count) is the recommended mitigation. Implementation team should confirm this approach in the `CreateGatewayAction`.

4. **Soft-deleted gateway and IoT service:** The internal `last-seen` endpoint uses `withTrashed()` to update soft-deleted gateways. The IoT service has no awareness of deletion status — it continues sending heartbeats. Confirm whether the platform should suppress status updates for deleted gateways or continue tracking them silently. Current spec: continue tracking silently (update `last_seen_at` even for soft-deleted gateways).

5. **`gateway_prefix` stored on `networks` table — immutability:** Once set, `gateway_prefix` cannot be changed via any API endpoint. Confirm this is acceptable — if a network is decommissioned and re-provisioned with a different physical gateway hardware, the prefix may need to change. Not in scope for this spec.

---

## Changelog

| Version | Date | Description |
|---------|------|-------------|
| v0.1 | 2026-04-06 | Initial draft |
