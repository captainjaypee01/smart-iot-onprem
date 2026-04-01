---
name: Project conventions
description: TypeScript check command, tsconfig structure, permission key format, hook patterns, constant patterns
type: project
---

## TypeScript Check

The project uses `tsc -p tsconfig.app.json --noEmit` (NOT `npm run typecheck` — that script does not exist). The correct build check is `npm run build` which runs `tsc -b && vite build`. The tsconfig uses composite/project references — `npx tsc --noEmit` alone fails with TS6305 errors.

**Why:** The project uses `tsconfig.json` with references to `tsconfig.app.json` and `tsconfig.node.json`. The `tsconfig.app.json` is the right target for type-checking app code.

**How to apply:** Always direct users to `npx tsc -p tsconfig.app.json --noEmit` or `npm run build` to verify types. Never run `npm run typecheck`.

## Permission Key Format

Pattern: `module.action` — e.g. `command.view`, `command.create`, `user.view`, `network.view`.

Hooks follow `useXPermissions()` convention returning named helpers `canViewX()`, `canCreateX()` etc.

## Constants File Location

All user-facing strings in `src/constants/`. General strings in `src/constants/strings.ts` as `UI_STRINGS`, `NAVBAR_STRINGS`, `COMPANY_STRINGS`, etc. Module-specific in e.g. `src/constants/commands.ts`.

## Nav Config

Static nav items live in `src/config/nav.ts` as `NAV_GROUPS: NavGroup[]`. Items can have `featureKey`, `permission`, `superadminOnly`, `notSuperadmin`, `accountOnly`, `adminOnly` flags.

## Pre-existing TypeScript Errors

As of 2026-04-01, there are pre-existing TS errors in `src/mocks/`, `src/hooks/useCompanies.ts`, `src/hooks/useDashboard.ts`, `src/hooks/useFireExtinguisher.ts`, `src/pages/auth/SetPasswordPage.tsx`, `src/pages/modules/FireExtinguisherPage.tsx`, `src/pages/networks/NetworksPage.tsx`, `src/pages/node-types/NodeTypesPage.tsx`, and `src/components/ui/combobox.tsx`. These are NOT new — do not attribute them to Command Console work.

## useNetworkOptions Hook

Located at `src/hooks/useNetworks.ts`, exported as `useNetworkOptions`. Returns `{ options: NetworkOption[], isLoading: boolean }`. `NetworkOption` has `id: number`, `name: string`, `network_address: string`, `is_active: boolean`.
