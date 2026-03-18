# Network Module — Shared Contract

Both API and frontend must treat this as immutable. Update this doc when the contract changes.

---

## Overview

The Network module manages IoT networks — the top-level logical grouping of IoT devices. Each network has a unique address, configuration for diagnostic intervals, alarm thresholds, maintenance windows, and a monthly reporting flag. This module is **superadmin-only**: no company admin or standard user has any access. Networks are configured once at deployment and updated infrequently.

---

## Auth Mechanism

Same as all other modules — cookie-based Sanctum (ADR-001). All endpoints additionally require `is_superadmin = true` on the authenticated user. Any authenticated non-superadmin receives `403 Forbidden`.

---

## Migration (Rewritten — Development Only)

The original migration is replaced in-place. The new schema adds all required columns.

```php
// database/migrations/0001_01_01_000007_create_networks_table.php

Schema::create('networks', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('network_address', 10)->unique()
        ->comment('3-byte hex e.g. 0xA3F2B1 — stored uppercase with 0x prefix');
    $table->text('description')->nullable();
    $table->text('remarks')->nullable();
    $table->boolean('is_active')->default(true);

    // Diagnostic
    $table->unsignedTinyInteger('diagnostic_interval')
        ->default(30)
        ->comment('Minutes between diagnostic messages. Allowed: 5, 10, 30');

    // Alarm threshold — stored as value + unit separately
    $table->unsignedSmallInteger('alarm_threshold')
        ->default(5)
        ->comment('Numeric value of alarm debounce threshold');
    $table->string('alarm_threshold_unit', 10)
        ->default('minutes')
        ->comment('Unit for alarm_threshold. Allowed: minutes, hours');

    // Wirepas
    $table->string('wirepas_version', 10)->nullable()
        ->comment('Fixed list: 5.2, 5.1, 5.0, 4.0');

    // Commissioned date — data before this date is hidden from customers
    $table->date('commissioned_date')->nullable()
        ->comment('Data before this date is not shown to customers.');

    // Maintenance window
    $table->boolean('is_maintenance')->default(false);
    $table->timestamp('maintenance_start_at')->nullable();
    $table->timestamp('maintenance_end_at')->nullable();

    // Reporting
    $table->boolean('has_monthly_report')->default(false);

    $table->timestamps();
});

// Pivot: network <-> node types (pure join, no extra columns)
Schema::create('network_node_types', function (Blueprint $table) {
    $table->foreignId('network_id')
        ->constrained('networks')->cascadeOnDelete();
    $table->string('node_type_key')
        ->comment('Matches NodeType enum key e.g. FIRE_EXTINGUISHER');
    $table->primary(['network_id', 'node_type_key']);
});
```

**Why `node_type_key` (string) instead of FK?**
Node types are a seeded enum constant — no `node_types` table exists yet. Using a string key keeps the pivot decoupled. When a full `node_types` table is added in a future module, a migration can backfill the FK.

**Why store `alarm_threshold_unit` as a separate column?**
Storing value + unit separately avoids unit-conversion bugs. The API always returns both fields together. Conversion to a canonical unit is deferred until a future module requires it.

---

## Network Address Generation

### Format
- Stored as 6 uppercase hex characters (3 bytes): e.g. `A3F2B1`
- Total string length: 6 characters
- Unique constraint on `network_address`

### Generation Algorithm (auto-generate mode)

```php
// app/Actions/Networks/GenerateNetworkAddressAction.php
public function execute(string $name): string
{
    $attempts = 0;
    do {
        if (++$attempts > 10) {
            throw new \RuntimeException('Could not generate a unique network address.');
        }
        $raw   = now()->toIso8601String() . $name . Str::random(16);
        $hash  = md5($raw);
        $hex6  = strtoupper(substr($hash, 0, 6));
    } while (Network::where('network_address', $hex6)->exists());

    return $hex6;
}
```

### Two input modes on the Create/Edit form

| Mode | Behaviour |
|------|-----------|
| **Manual** | Admin types a value directly. Validated on blur: regex `/^[0-9A-Fa-f]{6}$/i`. Uniqueness checked on submit. |
| **Auto-generate** | A "Generate" button calls `POST /api/v1/networks/generate-address`, receives a unique address, and pre-fills the field. Admin may regenerate multiple times. |

---

## Reference Data

### Node Types Enum

Node types are a PHP enum (`App\Enums\NodeType`) and a frontend constant (`src/constants/nodeTypes.ts`). Both sides must stay in sync via this contract. When the Node Types module is built, this list moves to a DB table.

| key | Display label |
|-----|---------------|
| `FIRE_EXTINGUISHER` | Fire Extinguisher |
| `SMOKE_DETECTOR` | Smoke Detector |
| `TEMPERATURE_SENSOR` | Temperature Sensor |
| `HUMIDITY_SENSOR` | Humidity Sensor |
| `MOTION_SENSOR` | Motion Sensor |
| `DOOR_SENSOR` | Door Sensor |

*When adding a new node type: update `NodeType` PHP enum, `src/constants/nodeTypes.ts`, and this table simultaneously.*

### Wirepas Version Options

Fixed list. Both sides use this exact set — no other non-null values are valid.

| Stored value | Display label |
|--------------|---------------|
| `5.2` | Wirepas 5.2 |
| `5.1` | Wirepas 5.1 |
| `5.0` | Wirepas 5.0 |
| `4.0` | Wirepas 4.0 |

`null` means no version set. Field is optional.

### Alarm Threshold Units

| Stored value | Display label |
|--------------|---------------|
| `minutes` | Minutes |
| `hours` | Hours |

Only `minutes` and `hours` are valid — any other value returns `422`.

### Diagnostic Interval Options

| Value | Display label |
|-------|---------------|
| `5` | 5 minutes |
| `10` | 10 minutes |
| `30` | 30 minutes |

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/networks | sanctum + superadmin | List networks (paginated) |
| GET | /api/v1/networks/{id} | sanctum + superadmin | Single network |
| POST | /api/v1/networks | sanctum + superadmin | Create network |
| PUT | /api/v1/networks/{id} | sanctum + superadmin | Update network |
| DELETE | /api/v1/networks/{id} | sanctum + superadmin | Delete network (if no devices) |
| POST | /api/v1/networks/generate-address | sanctum + superadmin | Generate a unique network address (stateless) |
| POST | /api/v1/networks/{id}/toggle-maintenance | sanctum + superadmin | Toggle maintenance flag on/off |
| GET | /api/v1/networks/options | sanctum + superadmin | Flat list for dropdowns |

**Notes:**
- All endpoints are superadmin-only. Non-superadmin receives `403` regardless of permissions.
- `generate-address` is stateless — generates and returns an address without persisting anything.
- `toggle-maintenance` follows ADR-013 single-action controller pattern.
- No `/options` scoping needed — superadmin sees all networks globally.

---

## POST /api/v1/networks/generate-address

Stateless. No request body required.

**Response `200`:**
```json
{ "data": { "network_address": "A3F2B1" } }
```

**Response `500`** (collision retry exhausted — statistically near-impossible):
```json
{ "message": "Could not generate a unique network address." }
```

---

## GET /api/v1/networks/options

Flat list for dropdowns when assigning a device to a network.

```json
{
  "data": [
    { "id": 1, "name": "Building A", "network_address": "A3F2B1", "is_active": true },
    { "id": 2, "name": "Building B", "network_address": "C4D5E6", "is_active": false }
  ]
}
```

---

## Pagination (GET /api/v1/networks)

Accepts `?page` and `?per_page` (1–100, default 15).

**Available filters:**

| Query param | Type | Description |
|-------------|------|-------------|
| `search` | string | Full-text on `name`, `network_address`, `description` |
| `is_active` | 0 \| 1 | Filter by active status |
| `is_maintenance` | 0 \| 1 | Filter by maintenance flag |

---

## API Response Shape (NetworkResource)

The API must produce exactly this shape. The frontend must consume exactly this shape.

```json
{
  "id": 1,
  "name": "Building A — Floor 3",
  "network_address": "A3F2B1",
  "description": "Main office floor 3 network",
  "remarks": "Installed by vendor X",
  "is_active": true,
  "diagnostic_interval": 30,
  "alarm_threshold": 5,
  "alarm_threshold_unit": "minutes",
  "wirepas_version": "5.2",
  "commissioned_date": "2026-03-20",
  "is_maintenance": false,
  "maintenance_start_at": null,
  "maintenance_end_at": null,
  "has_monthly_report": true,
  "node_types": ["FIRE_EXTINGUISHER", "SMOKE_DETECTOR"],
  "created_at": "2026-01-01T00:00:00+00:00",
  "updated_at": "2026-01-01T00:00:00+00:00"
}
```

**Field notes:**
- `commissioned_date` — date string `YYYY-MM-DD` only, no time component.
- `maintenance_start_at` / `maintenance_end_at` — ISO8601 datetime or `null`.
- `node_types` — array of `NodeType` enum key strings. Empty array `[]` if none assigned.
- `diagnostic_interval` — always one of `[5, 10, 30]`.
- `alarm_threshold` — positive integer; unit is given by `alarm_threshold_unit`.
- `alarm_threshold_unit` — always `"minutes"` or `"hours"`.
- `wirepas_version` — one of `["5.2", "5.1", "5.0", "4.0"]` or `null`.

---

## Request Payloads

### POST /api/v1/networks

```json
{
  "name": "string",
  "network_address": "string",
  "description": "string | null",
  "remarks": "string | null",
  "is_active": true,
  "diagnostic_interval": 30,
  "alarm_threshold": 5,
  "alarm_threshold_unit": "minutes",
  "wirepas_version": "5.2",
  "commissioned_date": "YYYY-MM-DD | null",
  "is_maintenance": false,
  "maintenance_start_at": "ISO8601 | null",
  "maintenance_end_at": "ISO8601 | null",
  "has_monthly_report": false,
  "node_types": ["FIRE_EXTINGUISHER"]
}
```

**Validation rules:**

| Field | Rule |
|-------|------|
| `name` | required, string, max:255 |
| `network_address` | required, string, regex:`/^[0-9A-Fa-f]{6}$/`, unique:networks |
| `description` | optional, nullable |
| `remarks` | optional, nullable |
| `is_active` | optional, boolean, default `true` |
| `diagnostic_interval` | required, integer, in:`[5,10,30]` |
| `alarm_threshold` | required, integer, min:1 |
| `alarm_threshold_unit` | required, string, in:`[minutes,hours]` |
| `wirepas_version` | optional, nullable, in:`[5.2,5.1,5.0,4.0]` |
| `commissioned_date` | optional, nullable, date_format:`Y-m-d` |
| `is_maintenance` | optional, boolean, default `false` |
| `maintenance_start_at` | nullable datetime ISO8601; `required_if:is_maintenance,true` |
| `maintenance_end_at` | nullable datetime ISO8601; `required_if:is_maintenance,true`; `after:maintenance_start_at` |
| `has_monthly_report` | optional, boolean, default `false` |
| `node_types` | optional, array; each item must be in `NodeType::values()` |

### PUT /api/v1/networks/{id}

Same fields as POST, all optional. Same validation rules apply to any field present.
`network_address` on update must still pass regex and uniqueness (excluding current record).

---

## POST /api/v1/networks/{id}/toggle-maintenance

**Turn ON:**
```json
{
  "is_maintenance": true,
  "maintenance_start_at": "2026-04-01T08:00:00+00:00",
  "maintenance_end_at":   "2026-04-01T18:00:00+00:00"
}
```

**Turn OFF:**
```json
{ "is_maintenance": false }
```

When turned **OFF**, both `maintenance_start_at` and `maintenance_end_at` are cleared to `null` by the API.

**Response `200`:** Full updated `NetworkResource`.

---

## Permission Keys for this Module

All endpoints are superadmin-only. The superadmin guard short-circuits before permission checks. No granular `network.*` keys are needed for the initial release.

| Permission key | Status |
|----------------|--------|
| `network.view` | Reserved — superadmin only for now |
| `network.create` | Reserved |
| `network.update` | Reserved |
| `network.delete` | Reserved |

---

## Business Rules

1. **Superadmin only.** Any authenticated non-superadmin receives `403` on every endpoint.
2. **Network cannot be deleted** if it has associated IoT devices (FK on a future `devices` table). API returns `409 Conflict: { message: "Network has active devices and cannot be deleted." }`. Frontend shows confirm dialog regardless.
3. **`network_address` regex:** Must match `/^[0-9A-Fa-f]{6}$/`. API normalises to uppercase on save.
4. **Maintenance coherence:** `maintenance_end_at` must be strictly after `maintenance_start_at`. Enforced via `after:` validation rule.
5. **Maintenance flag is manually controlled.** The system does NOT auto-clear `is_maintenance` when `maintenance_end_at` passes.
6. **When `is_maintenance` is turned OFF**, both `maintenance_start_at` and `maintenance_end_at` are set to `null`. Previous window values are discarded.
7. **`commissioned_date` is inclusive.** Data on and after this date is shown to customers. Data before is hidden. Date only — no time component.
8. **`node_types` is replace-all on update.** Sending `["SMOKE_DETECTOR"]` replaces all existing associations. Sending `[]` removes all. Omitting the field entirely leaves existing associations unchanged.
9. **Address generation retries up to 10 times** on collision. Returns `500` if all fail.
10. **`diagnostic_interval`** must be exactly `5`, `10`, or `30`. Any other value returns `422`.
11. **`alarm_threshold_unit`** must be exactly `"minutes"` or `"hours"`. Any other value returns `422`.
12. **`wirepas_version`** must be one of `["5.2", "5.1", "5.0", "4.0"]` or `null`. Any other non-null value returns `422`.

---

## Frontend UI Notes

### Networks List Page

- Route: `/networks` (lazy loaded, `is_superadmin` guard)
- Layout: `DashboardLayout`
- Table columns: Name, Network Address (monospace badge), Wirepas Version, Diagnostic Interval, Alarm Threshold (value + unit label), Active (status badge), Maintenance (warning badge when on), Node Types (compact badge list), Actions
- Filters: Search (name / address), Active toggle, Maintenance toggle
- Create action opens `NetworkFormDialog` (shadcn `Dialog`)
- Edit action opens `NetworkFormDialog` pre-filled
- Delete requires a confirm dialog; button disabled + tooltip if network has devices (future)
- Rows with `is_maintenance = true` show a yellow "Maintenance" badge

### NetworkFormDialog — Four Sections

**Section 1 — Basic Info**
- Name (text input)
- Network Address (text input + "Generate" button beside it)
  - "Generate" calls `POST /api/v1/networks/generate-address` and pre-fills the field
  - Validates regex `/^0x[0-9A-F]{6}$/i` on blur
- Description (textarea)
- Remarks (textarea)
- Is Active (toggle/switch)

**Section 2 — Configuration**
- Diagnostic Interval (shadcn `Select` — 3 options from `DIAGNOSTIC_INTERVAL_OPTIONS`)
- Alarm Threshold — two side-by-side controls: number input (min 1) + shadcn `Select` for unit (Minutes / Hours) from `ALARM_THRESHOLD_UNIT_OPTIONS`
- Wirepas Version (shadcn `Select` — 4 options from `WIREPAS_VERSION_OPTIONS` + a "None" option for `null`)
- Commissioned Date (date picker — date only, no time component)

**Section 3 — Maintenance**
- Is Maintenance (toggle/switch)
- Maintenance Start datetime picker — **only visible when `is_maintenance = true`**
- Maintenance End datetime picker — **only visible when `is_maintenance = true`**
- Client-side guard: End must be after Start before form submit is allowed

**Section 4 — Reporting & Node Types**
- Monthly Report (toggle/switch)
- Node Types (multi-select checkbox group — all options from `NODE_TYPE_OPTIONS` with display labels)

### Toggle Maintenance Quick Action (table row)
- "Set Maintenance" / "Clear Maintenance" button in row actions
- Turning ON: small `Dialog` for start/end datetime → `toggle-maintenance` with `is_maintenance: true`
- Turning OFF: single-confirm action, no datetime input → `toggle-maintenance` with `is_maintenance: false`

### Scoping & Visibility
- Entire module hidden from non-superadmin — sidebar link rendered only when `user.is_superadmin = true`
- No company filter — superadmin sees all networks globally

---

## TypeScript Types (`src/types/network.ts`)

```ts
export type DiagnosticInterval   = 5 | 10 | 30;
export type AlarmThresholdUnit   = 'minutes' | 'hours';
export type WirepasVersion       = '5.2' | '5.1' | '5.0' | '4.0';

export type NodeTypeKey =
  | 'FIRE_EXTINGUISHER'
  | 'SMOKE_DETECTOR'
  | 'TEMPERATURE_SENSOR'
  | 'HUMIDITY_SENSOR'
  | 'MOTION_SENSOR'
  | 'DOOR_SENSOR';

export interface Network {
  id: number;
  name: string;
  network_address: string;
  description: string | null;
  remarks: string | null;
  is_active: boolean;
  diagnostic_interval: DiagnosticInterval;
  alarm_threshold: number;
  alarm_threshold_unit: AlarmThresholdUnit;
  wirepas_version: WirepasVersion | null;
  commissioned_date: string | null;    // YYYY-MM-DD
  is_maintenance: boolean;
  maintenance_start_at: string | null; // ISO8601
  maintenance_end_at: string | null;   // ISO8601
  has_monthly_report: boolean;
  node_types: NodeTypeKey[];
  created_at: string;
  updated_at: string;
}

export interface NetworkListResponse {
  data: Network[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links: {
    first: string;
    next: string | null;
    prev: string | null;
    last: string;
  };
}

export interface NetworkOption {
  id: number;
  name: string;
  network_address: string;
  is_active: boolean;
}

export interface GenerateAddressResponse {
  data: { network_address: string };
}

export interface StoreNetworkPayload {
  name: string;
  network_address: string;
  description?: string | null;
  remarks?: string | null;
  is_active?: boolean;
  diagnostic_interval: DiagnosticInterval;
  alarm_threshold: number;
  alarm_threshold_unit: AlarmThresholdUnit;
  wirepas_version?: WirepasVersion | null;
  commissioned_date?: string | null;
  is_maintenance?: boolean;
  maintenance_start_at?: string | null;
  maintenance_end_at?: string | null;
  has_monthly_report?: boolean;
  node_types?: NodeTypeKey[];
}

export type UpdateNetworkPayload = Partial<StoreNetworkPayload>;

export interface ToggleMaintenancePayload {
  is_maintenance: boolean;
  maintenance_start_at?: string | null;
  maintenance_end_at?: string | null;
}
```

---

## Constants (`src/constants/nodeTypes.ts`)

```ts
// src/constants/nodeTypes.ts
// Must stay in sync with PHP enums NodeType and AlarmThresholdUnit

import type {
  NodeTypeKey,
  DiagnosticInterval,
  AlarmThresholdUnit,
  WirepasVersion,
} from '@/types/network';

export const NODE_TYPE_LABELS: Record<NodeTypeKey, string> = {
  FIRE_EXTINGUISHER:  'Fire Extinguisher',
  SMOKE_DETECTOR:     'Smoke Detector',
  TEMPERATURE_SENSOR: 'Temperature Sensor',
  HUMIDITY_SENSOR:    'Humidity Sensor',
  MOTION_SENSOR:      'Motion Sensor',
  DOOR_SENSOR:        'Door Sensor',
};

export const NODE_TYPE_OPTIONS = (
  Object.entries(NODE_TYPE_LABELS) as [NodeTypeKey, string][]
).map(([key, label]) => ({ key, label }));

export const DIAGNOSTIC_INTERVAL_OPTIONS: { value: DiagnosticInterval; label: string }[] = [
  { value: 5,  label: '5 minutes'  },
  { value: 10, label: '10 minutes' },
  { value: 30, label: '30 minutes' },
];

export const ALARM_THRESHOLD_UNIT_OPTIONS: { value: AlarmThresholdUnit; label: string }[] = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours',   label: 'Hours'   },
];

export const WIREPAS_VERSION_OPTIONS: { value: WirepasVersion; label: string }[] = [
  { value: '5.2', label: 'Wirepas 5.2' },
  { value: '5.1', label: 'Wirepas 5.1' },
  { value: '5.0', label: 'Wirepas 5.0' },
  { value: '4.0', label: 'Wirepas 4.0' },
];
```

---

## API File (`src/api/networks.ts`)

```ts
// src/api/networks.ts
// API functions for Network module endpoints

import axiosClient from "./axiosClient";
import type {
  Network,
  NetworkListResponse,
  NetworkOption,
  GenerateAddressResponse,
  StoreNetworkPayload,
  UpdateNetworkPayload,
  ToggleMaintenancePayload,
} from "@/types/network";

export const getNetworks = async (params?: {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: 0 | 1;
  is_maintenance?: 0 | 1;
}): Promise<NetworkListResponse> => {
  const res = await axiosClient.get("/v1/networks", { params });
  return res.data;
};

export const getNetworkOptions = async (): Promise<{ data: NetworkOption[] }> => {
  const res = await axiosClient.get("/v1/networks/options");
  return res.data;
};

export const getNetwork = async (id: number): Promise<{ data: Network }> => {
  const res = await axiosClient.get(`/v1/networks/${id}`);
  return res.data;
};

export const generateNetworkAddress = async (): Promise<GenerateAddressResponse> => {
  const res = await axiosClient.post("/v1/networks/generate-address");
  return res.data;
};

export const createNetwork = async (
  payload: StoreNetworkPayload,
): Promise<{ data: Network }> => {
  const res = await axiosClient.post("/v1/networks", payload);
  return res.data;
};

export const updateNetwork = async (
  id: number,
  payload: UpdateNetworkPayload,
): Promise<{ data: Network }> => {
  const res = await axiosClient.put(`/v1/networks/${id}`, payload);
  return res.data;
};

export const deleteNetwork = async (id: number): Promise<void> => {
  await axiosClient.delete(`/v1/networks/${id}`);
};

export const toggleMaintenance = async (
  id: number,
  payload: ToggleMaintenancePayload,
): Promise<{ data: Network }> => {
  const res = await axiosClient.post(`/v1/networks/${id}/toggle-maintenance`, payload);
  return res.data;
};
```

---

## PHP Enums

### `App\Enums\NodeType`

```php
<?php
// app/Enums/NodeType.php — must stay in sync with NODE_TYPE_LABELS in nodeTypes.ts
declare(strict_types=1);
namespace App\Enums;

enum NodeType: string
{
    case FIRE_EXTINGUISHER  = 'FIRE_EXTINGUISHER';
    case SMOKE_DETECTOR     = 'SMOKE_DETECTOR';
    case TEMPERATURE_SENSOR = 'TEMPERATURE_SENSOR';
    case HUMIDITY_SENSOR    = 'HUMIDITY_SENSOR';
    case MOTION_SENSOR      = 'MOTION_SENSOR';
    case DOOR_SENSOR        = 'DOOR_SENSOR';

    public function label(): string
    {
        return match($this) {
            self::FIRE_EXTINGUISHER  => 'Fire Extinguisher',
            self::SMOKE_DETECTOR     => 'Smoke Detector',
            self::TEMPERATURE_SENSOR => 'Temperature Sensor',
            self::HUMIDITY_SENSOR    => 'Humidity Sensor',
            self::MOTION_SENSOR      => 'Motion Sensor',
            self::DOOR_SENSOR        => 'Door Sensor',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
```

### `App\Enums\AlarmThresholdUnit`

```php
<?php
// app/Enums/AlarmThresholdUnit.php — must stay in sync with ALARM_THRESHOLD_UNIT_OPTIONS
declare(strict_types=1);
namespace App\Enums;

enum AlarmThresholdUnit: string
{
    case MINUTES = 'minutes';
    case HOURS   = 'hours';
}
```

---

## Checklist Before Implementation

### API
- [ ] Migration rewritten — both `networks` and `network_node_types` tables
- [ ] `NodeType` PHP enum created at `app/Enums/NodeType.php`
- [ ] `AlarmThresholdUnit` PHP enum created at `app/Enums/AlarmThresholdUnit.php`
- [ ] `GenerateNetworkAddressAction` with collision-retry loop (max 10 attempts)
- [ ] `GenerateAddressController` — single-action, stateless, no DB write (ADR-013)
- [ ] `ToggleMaintenanceController` — single-action (ADR-013); clears datetimes on turn-off
- [ ] `NetworkResource` shape matches contract exactly — all fields including `alarm_threshold_unit`, `wirepas_version`, `node_types` array
- [ ] `StoreNetworkRequest::authorize()` checks `is_superadmin` only — no permission key needed
- [ ] All validation rules implemented including cross-field `after:maintenance_start_at`
- [ ] `network_address` normalised to uppercase in action or model mutator
- [ ] `node_types` pivot uses `sync()` — replace-all; omitted field = pivot untouched
- [ ] Routes registered for all 8 endpoints in `routes/api.php`
- [ ] Feature tests cover: happy path CRUD, address generation, toggle maintenance on/off, `403` for non-superadmin on all 8 endpoints, `409` delete stub, all `422` validation branches (including bad `diagnostic_interval`, bad `wirepas_version`, bad `alarm_threshold_unit`, maintenance window coherence)

### Frontend
- [ ] Types added to `src/types/network.ts`
- [ ] Constants added to `src/constants/nodeTypes.ts` (all five option arrays)
- [ ] API file created at `src/api/networks.ts`
- [ ] Custom hook at `src/hooks/useNetworks.ts`
- [ ] Page at `src/pages/networks/NetworksPage.tsx`
- [ ] `NetworkFormDialog` component in `src/components/shared/`
- [ ] Route added to `src/routes/AppRouter.tsx` (lazy loaded)
- [ ] Sidebar link conditionally rendered on `user.is_superadmin`
- [ ] "Generate" button calls `generateNetworkAddress()` and fills the field; button shows loading state
- [ ] Network address field validates regex on blur
- [ ] Maintenance datetime fields shown/hidden via `is_maintenance` toggle state
- [ ] Client-side validation: `maintenance_end_at` after `maintenance_start_at` before submit
- [ ] Alarm Threshold rendered as value input + unit select side-by-side using `ALARM_THRESHOLD_UNIT_OPTIONS`
- [ ] Wirepas Version uses `WIREPAS_VERSION_OPTIONS` (4 options + null/none) — never hardcoded
- [ ] Node Types multi-select uses `NODE_TYPE_OPTIONS` from constants — never hardcoded
- [ ] Diagnostic Interval uses `DIAGNOSTIC_INTERVAL_OPTIONS` from constants
- [ ] All user-facing strings in `src/constants/strings.ts`
- [ ] Dark mode variants present on all custom styles

---

## Open Questions

- [ ] Should `network_address` become immutable once IoT devices are attached to the network? (Recommend: yes — add to Business Rules when the Devices module is spec'd.)
- [ ] Is there a maximum `alarm_threshold` value per unit? (e.g. max 60 for minutes, max 24 for hours?) Confirm before implementation.
- [ ] Will `commissioned_date` filtering be enforced server-side (API query) or frontend-display only? This impacts where the filtering logic lives.