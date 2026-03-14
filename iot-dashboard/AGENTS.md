# IoT Monitoring Dashboard — Project Rules & Guidelines

## Tech Stack (Strict Versions)

| Layer | Technology | Notes |
|---|---|---|
| Framework | React 19 | Use functional components only |
| Language | TypeScript 5+ | Strict mode enabled, no `any` |
| Styling | Tailwind CSS v4 | No `tailwind.config.ts` — config lives in `index.css` |
| Components | shadcn/ui (latest) | Always install via `npx shadcn@latest add <component>` |
| Icons | lucide-react | No other icon libraries |
| Routing | react-router-dom v7 | No other router |
| State | Zustand | Only for global state (auth, theme). Use local state for UI |
| HTTP | Axios | Always use the shared `axiosClient.ts` instance |
| Charts | Recharts | For all data visualizations |
| Build Tool | Vite | No CRA, no Next.js |
| Runtime | Node 22 |  |

---

## Project Structure Rules

```
src/
├── api/              # Only Axios calls. One file per API domain.
├── components/
│   ├── auth/         # Auth bootstrap / session (e.g. AuthBootstrap.tsx)
│   ├── ui/           # shadcn auto-generated files only. Never edit manually.
│   └── shared/       # Reusable custom components (cards, badges, tables)
├── context/          # React context providers (ThemeContext)
├── constants/        # Constants values and strings that will be used in the project
├── hooks/            # Custom hooks only. Must start with "use"
├── layouts/          # Page layout shells (DashboardLayout, AuthLayout)
├── lib/              # Utilities. Only utils.ts (cn helper) lives here
├── mocks/            # Mock handlers for local development (VITE_USE_MOCK=true only)
├── pages/            # One folder per route. Page files only — no logic
├── routes/           # AppRouter.tsx and PrivateRoute.tsx only
├── store/            # Zustand stores only
└── types/            # TypeScript interfaces and types only
```

### Structure Rules
- `components/ui/` is **shadcn-only**. Never create custom components here.
- `pages/` files must be **thin** — no business logic, no API calls directly.
- All API calls go through `src/api/`. Pages call hooks, hooks call API files.
- Never create empty folders or placeholder files.
- One component per file. Filename matches the component name exactly.
- `src/mocks/` is for local development only — never import mock handlers in production code paths. Always guard with `VITE_USE_MOCK`.

---

## TypeScript Rules

- **No `any`** — ever. Use `unknown` and narrow it, or define a proper type.
- All API response shapes must be defined in `src/types/`.
- All component props must have an explicit interface defined above the component.
- Use `type` for unions and primitives. Use `interface` for object shapes.
- Always type the return value of custom hooks.
- `src/types/auth.ts` is the **single source of truth** for all auth-related types (`User`, `Company`, `Role`, `AuthResponse`, `LoginCredentials`, etc.). Never redefine these in `index.ts`.
- `src/types/index.ts` re-exports from domain type files — it does not define auth types itself.

```ts
// ✅ Correct
interface DeviceCardProps {
  deviceId: string;
  status: "online" | "offline" | "warning";
}

// ❌ Wrong
const DeviceCard = (props: any) => { ... }

// ✅ Correct — import auth types from the domain file
import type { User } from "@/types/auth";

// ❌ Wrong — do not redefine User in index.ts
export interface User { id: string; role: "admin" | "viewer" }
```

---

## Styling Rules

- **Tailwind v4 only** — no inline styles, no CSS modules, no styled-components.
- Use `cn()` from `src/lib/utils.ts` whenever classes are conditional.
- Dark mode is **class-based** — toggled by adding/removing `dark` on `<html>`.
- Never use `@media (prefers-color-scheme)` — always use the `.dark` class.
- Brand colors are available as Tailwind utilities:
  - `bg-brand-blue` → `#0033cc`
  - `bg-brand-navy` → `#2a3f54`
  - `bg-brand-light` → `#3355ff`
  - `bg-brand-dark` → `#00228a`
  - `bg-gradient-brand` → sidebar/header gradient
- Use shadcn semantic tokens (`bg-primary`, `text-muted-foreground`) for components.
- Use brand tokens (`bg-brand-blue`) only for hero elements, sidebar, and headers.
- **Exception**: The login page left panel gradient uses `style={{ background: "linear-gradient(...)" }}` — this is the only permitted inline style and must not be changed to a class.

```tsx
// ✅ Correct
<div className={cn("rounded-lg bg-card p-4", isActive && "border-brand-blue")}>

// ❌ Wrong — anywhere except the login panel gradient
<div style={{ backgroundColor: "#0033cc" }}>
```

---

## Component Rules

- **Always use shadcn components** where one exists before building custom.
  - e.g. use `<Button>`, `<Card>`, `<Dialog>`, `<Table>` from shadcn.
- Install shadcn components with: `npx shadcn@latest add <name>`
- Custom components go in `src/components/shared/`.
- Never put API calls or Zustand access inside a UI component directly.
- Props must flow down; data must come from hooks.

```tsx
// ✅ Correct pattern
// page calls a hook, passes data to component
const DevicesPage = () => {
  const { devices, isLoading } = useDevices();
  return <DeviceTable devices={devices} isLoading={isLoading} />;
};

// ❌ Wrong pattern — API call inside a component
const DeviceTable = () => {
  const [devices, setDevices] = useState([]);
  useEffect(() => { axios.get("/devices").then(...) }, []);
};
```

---

## API & Data Fetching Rules

- **Always use** `src/api/axiosClient.ts` — never import `axios` directly in pages or components.
- One API file per domain: `auth.ts`, `users.ts`, `devices.ts`, `alerts.ts`, `metrics.ts`.
- All API functions are `async` and return typed responses.
- HTTP errors are handled globally in the Axios interceptor — do not duplicate in components.
- The base URL is always `/api` — never hardcode ports or hostnames.
- API path prefix is `/v1/` — all endpoints must follow `/api/v1/` convention.

```ts
// src/api/devices.ts ✅ Correct
import axiosClient from "./axiosClient";
import type { Device } from "@/types";

export const getDevices = async (): Promise<Device[]> => {
  const res = await axiosClient.get("/v1/devices");
  return res.data;
};

// ❌ Wrong — importing axios directly in a page
import axios from "axios";
axios.get("http://localhost:8000/api/devices");
```

---

## Auth Rules

- **`useAuth`** is the single hook for all authentication actions: `handleLogin`, `handleLogout`, `handleMicrosoftLogin`.
- Never create a separate `useLogin` or `useMsal` hook — everything auth-related lives in `useAuth`.
- The `useAuthStore` (Zustand) holds `user` and `isAuthenticated` (plus non-persisted `authCheckDone`, `rehydrated` for bootstrap). No token; auth is cookie-based.
- **Session**: Session = httpOnly session cookie set by the API + user in the store (from `GET /auth/me`). The SPA never sees or stores a token; it uses `withCredentials: true` and sends the CSRF token (`X-XSRF-TOKEN`) on state-changing requests.
- **Session rehydration**: On app load, `AuthBootstrap` runs once after Zustand rehydrates and calls `GET /auth/me` with credentials. Purpose of "me": (1) session check — "Do we already have a valid session?" (2) rehydration — put current user in the store; (3) called even when the first route is `/login` so we can redirect already-logged-in users. If 200, stores user; if 401, clears store and redirects to `/login`. Until that check completes, `PrivateRoute` shows a full-page loader. Public pages (`LoginPage`, `SetPasswordPage`) redirect to `/` when `authCheckDone && isAuthenticated` so a logged-in user never stays on login or set-password.
- SSO flow: `useAuth.handleMicrosoftLogin()` → fetches redirect URL from API → `window.location.href` redirect → Laravel callback (sets session cookie and redirects) → `/auth/callback` page → `getMe()` with credentials → `authStore.setAuth(user)` → `/dashboard`. No token or user in the URL.
- The `/auth/callback` page calls `GET /auth/me` with credentials to load the user after the API has set the session cookie.
- The `/set-password` page handles the invite link flow for newly created users. It reads `?token=` and `?email=` from the URL.
- SSO error codes arrive as `?error=` on `/login` and must be mapped through `SSO_ERROR_MESSAGES` from `src/constants/auth.ts`.
- Mock mode (`VITE_USE_MOCK=true`) bypasses the real API. `handleMicrosoftLogin` shows an info toast in mock mode instead of redirecting.

```ts
// ✅ Correct — one hook for all auth
const { handleLogin, handleLogout, handleMicrosoftLogin, isLoading, error } = useAuth();

// ❌ Wrong — split hooks
const { handleLogin } = useLogin();
const { handleMicrosoftLogin } = useMicrosoftAuth();
```

---

## SSO Provider Config (LoginPage)

- SSO providers are defined in the `SSO_PROVIDERS` array inside `LoginPage.tsx`.
- Set `enabled: false` to show "Coming soon" while the backend is not ready.
- Set `enabled: true` once the Laravel Socialite route is live.
- Microsoft is the primary provider. Google is secondary and disabled by default.
- Never hardcode `window.location.href = "/api/auth/sso/..."` — always go through `useAuth.handleMicrosoftLogin()` which calls the API.

---

## Routing Rules

- All routes are defined in `src/routes/AppRouter.tsx` only.
- Protected routes use `<PrivateRoute />` which checks Zustand `isAuthenticated`.
- Route paths use kebab-case: `/device-groups`, `/alert-history`.
- Lazy load pages using `React.lazy()` to keep the bundle small.
- Auth routes that must exist:
  - `/login` — public
  - `/auth/callback` — public, handles SSO redirect from Laravel
  - `/set-password` — public, handles invite email link

```tsx
// ✅ Correct — lazy loaded pages
const DashboardPage    = React.lazy(() => import("@/pages/dashboard/DashboardPage"));
const LoginPage        = React.lazy(() => import("@/pages/auth/LoginPage"));
const AuthCallbackPage = React.lazy(() => import("@/pages/auth/AuthCallbackPage"));
const SetPasswordPage  = React.lazy(() => import("@/pages/auth/SetPasswordPage"));
```

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase | `DeviceCard.tsx` |
| Hooks | camelCase with `use` prefix | `useDevices.ts` |
| API files | camelCase | `devices.ts` |
| Types/Interfaces | PascalCase | `Device`, `AlertPayload` |
| Zustand stores | camelCase with `use` prefix | `useAuthStore.ts` |
| CSS / Tailwind | Never custom class names | Use Tailwind utilities only |
| Route paths | kebab-case | `/device-groups` |
| Env variables | SCREAMING_SNAKE_CASE | `VITE_API_BASE_URL` |
| SSO error codes | kebab-case string literals | `"account_not_found"` |

---

## File Header Comment (Required on every file)

Every file must start with a short comment stating its purpose:

```ts
// src/api/devices.ts
// API functions for IoT device management endpoints
```

---

## Dark / Light Mode Rules

- Dark mode is toggled by `ThemeContext` which adds/removes `dark` on `<html>`.
- Always write **both** light and dark variants for custom styles.
- Use `dark:` prefix in Tailwind for dark overrides.
- Never rely on OS dark mode preference (`prefers-color-scheme`).
- shadcn components handle dark mode automatically via CSS variables.

```tsx
// ✅ Always write both
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">

// ❌ Light mode only — will break in dark mode
<div className="bg-white text-gray-900">
```

---

## Notifications / Toast Rules

- **Sonner is the only toast library** — never use `react-hot-toast`, `react-toastify`, or shadcn's own `useToast`.
- The `<Toaster />` is mounted once in `App.tsx` — never add another instance.
- Always import `toast` from `sonner` directly, never from a wrapper.
- Use the correct variant per situation:
  - `toast.success()` — action completed (device saved, login success)
  - `toast.error()` — something failed (API error, validation)
  - `toast.warning()` — needs attention but not blocking
  - `toast.info()` — neutral system message (e.g. SSO not available in mock mode)
  - `toast.loading()` + `toast.dismiss()` — for async operations with feedback

```ts
// ✅ Correct
import { toast } from "sonner";
toast.success("Device saved successfully.");
toast.error("Failed to connect. Check your network.");

// ❌ Wrong
import { useToast } from "@/components/ui/use-toast";
import toast from "react-hot-toast";
```

---

## Constants & Strings Rules

- All user-facing strings live in `src/constants/strings.ts` — never hardcode display text in components.
- All domain constants (fault types, node types, sensor configs) live in `src/constants/`.
- Auth-specific strings and SSO error message maps live in `src/constants/auth.ts`.
- Always import from the barrel: `import { FAULT_META, NODE_TYPE } from "@/constants"`.
- Always import auth constants directly: `import { SSO_ERROR_MESSAGES } from "@/constants/auth"`.
- Never use magic strings like `"MISSING"` or `"Fire Extinguisher"` inline in components.
- When adding a new fault type or node type, update the constants files first before touching any UI.

---

## What NOT to Do (Hard Rules)

- ❌ No `any` in TypeScript
- ❌ No inline styles (except the login page left panel gradient — documented exception)
- ❌ No direct `axios` imports outside of `src/api/`
- ❌ No API calls inside components — always via a hook
- ❌ No `tailwind.config.ts` — config is in `index.css`
- ❌ No `@media (prefers-color-scheme)` — use `.dark` class only
- ❌ No editing files inside `src/components/ui/` — shadcn owns those
- ❌ No hardcoded colors — use Tailwind utilities or CSS variables
- ❌ No placeholder or empty files — only create files with real content
- ❌ No other UI libraries (MUI, Ant Design, Chakra) — shadcn only
- ❌ No class components — functional components only
- ❌ No `useEffect` for data fetching — use a custom hook that wraps the API call
- ❌ No hardcoded `window.location.href` for SSO — always go through `useAuth.handleMicrosoftLogin()`
- ❌ No reading `?token=` from the URL anywhere except `AuthCallbackPage` and `SetPasswordPage`
- ❌ No duplicate type definitions — auth types live in `src/types/auth.ts` only
- ❌ No mock imports outside of `VITE_USE_MOCK` guards