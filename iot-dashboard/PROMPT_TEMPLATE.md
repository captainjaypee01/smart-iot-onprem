Context:
- Project: IoT Monitoring Dashboard
- Stack: React 19, TypeScript 5+, Tailwind CSS v4, shadcn/ui, Zustand, Axios, react-router-dom v7, Recharts, Sonner
- Rules: Follow AGENTS.md strictly

Task:
[Describe what you want built — be specific about the feature/page/component]

Scope:
- Page(s): [e.g. src/pages/users/UsersPage.tsx]
- Hook(s): [e.g. src/hooks/useUsers.ts]
- API file(s): [e.g. src/api/users.ts]
- Component(s): [e.g. src/components/shared/UserTable.tsx]
- Type(s): [e.g. src/types/users.ts]
- Constants: [e.g. src/constants/users.ts — if any new strings needed]

Existing files to reference:
- [Attach or paste relevant files the agent should stay consistent with]

API contract:
- [List the endpoints this feature will consume]
- e.g. GET /api/v1/users → returns PaginatedResponse<User>
- e.g. POST /api/v1/users → body: StoreUserRequest, returns UserResource

Behaviour:
- [Describe what the page/component should do, step by step]
- [Describe loading, empty, and error states]
- [Describe any modals, toasts, or confirmations needed]

Do NOT:
- Create any mock data
- Add API calls inside components
- Use inline styles
- Hardcode strings — use constants
- Use any type


```
You are a senior full-stack engineer working on the Smart IoT On-Prem project.

STACK:
- Backend: Laravel 12, PHP 8.4, Pest PHP testing
- Frontend: React 19, TypeScript 5 (strict), Tailwind CSS v4, shadcn/ui, 
  Zustand, Axios, react-router-dom v7

ALWAYS read these files before writing any code:
- AGENTS.md (project root) — coding standards, folder structure, naming rules
- @docs/specs/node-type-module-contract.md — Node Type contract
- @docs/specs/network-module-contract.md — Network contract

HARD RULES:
- No `any` in TypeScript — ever
- No inline styles — Tailwind only
- No direct axios imports — always use src/api/axiosClient.ts
- No API calls inside components — always via a custom hook
- No hardcoded display strings — use src/constants/strings.ts
- Always write dark: variants for any custom styles
- shadcn components only — install via `npx shadcn@latest add <name>`
- Sonner for toasts — import { toast } from 'sonner'
- Auth is cookie-based Sanctum — withCredentials: true, no Authorization header

The contract is always the source of truth. If anything conflicts with 
your training data, the contract wins.

Read @docs/specs/network-module-contract.md — "Network Address Generation", 
"PHP Enums", and "Business Rules" sections.

Confirm app/Enums/AlarmThresholdUnit.php exists (created in NT-2).
If not, create it now with cases MINUTES = 'minutes' and HOURS = 'hours'.

Then create:

1. app/Actions/Networks/GenerateNetworkAddressAction.php
   - Takes string $name as input
   - Algorithm:
     $attempts = 0;
     do {
       if (++$attempts > 10) throw RuntimeException
       $raw = now()->toIso8601String() . $name . Str::random(16);
       $hash = md5($raw);
       $hex6 = strtoupper(substr($hash, 0, 6));
       $address = '0x' . $hex6;
     } while (Network::where('network_address', $address)->exists());
     return $address;
   - Returns the generated address string

2. app/Actions/Networks/StoreNetworkAction.php
   - Accepts StoreNetworkDTO (create in app/DTO/Networks/)
   - Normalises network_address to uppercase: '0x' . strtoupper(substr($addr,2))
   - Syncs node_types pivot: $network->nodeTypes()->sync($dto->nodeTypeIds ?? [])
   - Returns created Network model with nodeTypes relationship loaded

3. app/Actions/Networks/UpdateNetworkAction.php
   - Accepts UpdateNetworkDTO
   - Normalises network_address if present
   - node_types: if present in payload, sync(); if absent, do NOT touch pivot
   - Returns updated Network model

4. app/Actions/Networks/ToggleMaintenanceAction.php
   - Accepts network + payload
   - If turning ON: set is_maintenance=true, start/end from payload
   - If turning OFF: set is_maintenance=false, 
     maintenance_start_at=null, maintenance_end_at=null
   - Returns updated Network model
```