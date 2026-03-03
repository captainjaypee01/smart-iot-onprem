cd web
npx shadcn@latest add button input label
```

---

## What Was Built and Why

Here's a breakdown of every decision made:

**File structure — 2 files, clean separation:**
```
src/hooks/useAuth.ts         ← all logic (API call, error, redirect)
src/pages/auth/LoginPage.tsx ← pure UI, zero business logic
```

**`useAuth.ts` — the hook handles:**
- Calling `src/api/auth.ts` (never Axios directly)
- Writing to Zustand `authStore` on success
- Capturing the Laravel error message from `response.data.message`
- Redirecting to `/` after successful login

**`LoginPage.tsx` — the page handles:**
- Two-column layout — branding left, form right (collapses to single column on mobile)
- Theme toggle in the top-right corner (works immediately with your `ThemeContext`)
- Show/hide password toggle
- Error banner that shows the exact message returned by your Laravel API
- Loading state with spinner on the button while the request is in-flight
- All colors use your brand gradient (`#2a3f54 → #0033cc`) and shadcn tokens so dark mode works automatically

---

## How the Login Flow Works End to End
```
User submits form
  → useAuth.handleLogin()
    → src/api/auth.ts login()
      → POST /api/auth/login  (proxied to Laravel)
        ← { token, user }
  → useAuthStore.setAuth(user, token)  stores in localStorage
  → navigate("/")  → PrivateRoute sees isAuthenticated=true → DashboardPage