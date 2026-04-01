---
name: Command module patterns
description: Key patterns, conventions, and component decisions in the Command Console module
type: project
---

The Command Console module (`src/pages/commands/`) uses these established patterns:

- `PROCESSING_STATUS_CLASSES` is a `Record<number, string>` Tailwind class map defined locally in both `CommandConsolePage.tsx` and `CommandDetailDialog.tsx` (intentionally duplicated, not extracted to constants, because it's a UI concern).
- The actions column in the table now renders a "View" ghost button that opens `CommandDetailDialog` via `detailId` state — Resend moved into the dialog.
- `useCommand(id: string | null)` hook: when `id` is null it does nothing; when set it fetches `GET /api/v1/commands/{id}`. The dialog passes `open={id !== null}`.
- `CommandDetailDialog` receives `canCreate`, `isSuperAdmin`, and `currentUserId` as props — these come from the parent page (lifted, not re-fetched).
- Resend eligibility in the dialog: `canCreate && (isOwner || isSuperAdmin) && retry_count < 3 && processing_status !== PROCESSING_STATUS.FAILED (4)`.
- `Separator` from shadcn is used to divide metadata rows from timestamp rows in the dialog.
- `ScrollArea` wraps the dialog body for mobile scroll; `DialogContent` uses `max-h-[90vh] flex flex-col`.
- All dialog strings are in `COMMAND_STRINGS` in `src/constants/commands.ts` under a `// ── Command Detail Dialog` comment block.
- Permission keys: `command.view` (read history), `command.create` (send + resend).

**Why:** The `onResendSuccess` callback in `CommandDetailDialog` calls both `setDetailId(null)` and `void refetch()` in the parent — this keeps the table fresh after a resend without extra API calls in the dialog itself.
