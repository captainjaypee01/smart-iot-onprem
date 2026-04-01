---
name: Command Console module
description: Status and file locations for the Command Console frontend module (commands feature)
type: project
---

## Status: Complete (as of 2026-04-01)

All Command Console module files exist and are correct.

## File Locations

| Step | File |
|------|------|
| Types | `src/types/command.ts` |
| API | `src/api/commands.ts` |
| Hook (data) | `src/hooks/useCommands.ts` — `useCommands`, `useSendCommand`, `useResendCommand` |
| Hook (permissions) | `src/hooks/useCommandPermissions.ts` — `canViewCommands()`, `canCreateCommand()` |
| Constants | `src/constants/commands.ts` — `COMMAND_STRINGS`, `PROCESSING_STATUS_OPTIONS`, `MESSAGE_STATUS_OPTIONS` |
| Page | `src/pages/commands/CommandConsolePage.tsx` |
| Route | `src/routes/AppRouter.tsx` — `/commands` with `FeatureRoute featureKey="command-console"` |
| Sidebar | `src/config/nav.ts` — IoT Management group, `featureKey: "command-console"`, `permission: "command.view"` |

## Permission Keys (from command-module-contract.md)

- `command.view` — read history
- `command.create` — send / resend

## Resend Ownership Rule

Resend button is shown only if `canCreateCommand()` AND (`user.id === row.created_by?.id` OR `isSuperAdmin()`).

## Auto-refresh

Default ON, 15-second interval. Toggle via Switch in history section header. Interval managed via `useRef<ReturnType<typeof setInterval>>`.

## Key Design Decisions

- Network options are fetched once via `useNetworkOptions()` and reused in both the send form and filter bar (no duplicate calls).
- `ResendButton` is a sub-component so each row has its own `isSubmitting` state.
- Processing status uses color-coded `Badge` with `PROCESSING_STATUS_CLASSES` map.
- Form local state uses string values for number inputs (converted on submit); `network_id` is string for Select compatibility.
