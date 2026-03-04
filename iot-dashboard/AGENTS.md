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
│   ├── ui/           # shadcn auto-generated files only. Never edit manually.
│   └── shared/       # Reusable custom components (cards, badges, tables)
├── context/          # React context providers (ThemeContext)
├── constants/        # Constants values and strings that will be used in the project
├── hooks/            # Custom hooks only. Must start with "use"
├── layouts/          # Page layout shells (DashboardLayout, AuthLayout)
├── lib/              # Utilities. Only utils.ts (cn helper) lives here
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

---

## TypeScript Rules

- **No `any`** — ever. Use `unknown` and narrow it, or define a proper type.
- All API response shapes must be defined in `src/types/`.
- All component props must have an explicit interface defined above the component.
- Use `type` for unions and primitives. Use `interface` for object shapes.
- Always type the return value of custom hooks.

```ts
// ✅ Correct
interface DeviceCardProps {
  deviceId: string;
  status: "online" | "offline" | "warning";
}

// ❌ Wrong
const DeviceCard = (props: any) => { ... }
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

```tsx
// ✅ Correct
<div className={cn("rounded-lg bg-card p-4", isActive && "border-brand-blue")}>

// ❌ Wrong
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
- One API file per domain: `devices.ts`, `alerts.ts`, `auth.ts`, `metrics.ts`.
- All API functions are `async` and return typed responses.
- HTTP errors are handled globally in the Axios interceptor — do not duplicate in components.
- The base URL is always `/api` — never hardcode ports or hostnames.

```ts
// src/api/devices.ts ✅ Correct
import axiosClient from "./axiosClient";
import type { Device } from "@/types";

export const getDevices = async (): Promise<Device[]> => {
  const res = await axiosClient.get("/devices");
  return res.data;
};

// ❌ Wrong — importing axios directly in a page
import axios from "axios";
axios.get("http://localhost:8000/api/devices");
```

---

## State Management Rules

- **Zustand** is for global state only: authentication, theme preference.
- **React `useState`** for local UI state (modals open/closed, form values).
- **No Redux, no Context for data** — context is only for theme.
- Never store derived data in Zustand — compute it on the fly.

```ts
// ✅ Zustand for global auth state only
const useAuthStore = create<AuthState>()(
  persist((set) => ({
    user: null,
    token: null,
    setAuth: (user, token) => set({ user, token }),
    logout: () => set({ user: null, token: null }),
  }), { name: "iot-auth" })
);
```

---

## Routing Rules

- All routes are defined in `src/routes/AppRouter.tsx` only.
- Protected routes use `<PrivateRoute />` which checks Zustand for a token.
- Route paths use kebab-case: `/device-groups`, `/alert-history`.
- Lazy load pages using `React.lazy()` to keep the bundle small.

```tsx
// ✅ Correct — lazy loaded pages
const DashboardPage = React.lazy(() => import("@/pages/dashboard/DashboardPage"));
const LoginPage     = React.lazy(() => import("@/pages/auth/LoginPage"));
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

## Notifications / Toast Rules
- **Sonner is the only toast library** — never use `react-hot-toast`, `react-toastify`, or shadcn's own `useToast`.
- The `<Toaster />` is mounted once in `App.tsx` — never add another instance.
- Always import `toast` from `sonner` directly, never from a wrapper.
- Use the correct variant per situation:
  - `toast.success()` — action completed (device saved, login success)
  - `toast.error()` — something failed (API error, validation)
  - `toast.warning()` — needs attention but not blocking
  - `toast.info()` — neutral system message
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

## Constants & Strings Rules
- All user-facing strings live in `src/constants/strings.ts` — never hardcode display text in components
- All domain constants (fault types, node types, sensor configs) live in `src/constants/`
- Always import from the barrel: `import { FAULT_META, NODE_TYPE } from "@/constants"`
- Never use magic strings like `"MISSING"` or `"Fire Extinguisher"` inline in components
- When adding a new fault type or node type, update the constants files first before touching any UI
---

## What NOT to Do (Hard Rules)

- ❌ No `any` in TypeScript
- ❌ No inline styles
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
