// src/constants/auth.ts
// User-facing strings and constants for the authentication flow

/** Login / callback / set-password copy — nested shape. Import from `@/constants/auth` in auth pages. */
export const AUTH_FLOW_STRINGS = {
    login: {
        title: "Welcome back",
        subtitle: "Sign in to your account to continue",
        emailLabel: "Email address",
        emailPlaceholder: "you@company.com",
        passwordLabel: "Password",
        passwordPlaceholder: "••••••••",
        submitButton: "Sign in",
        submittingButton: "Signing in...",
        divider: "or continue with",
        microsoftButton: "Sign in with Microsoft",
        microsoftLoading: "Redirecting to Microsoft...",
    },
    setPassword: {
        title: "Set your password",
        subtitle: "Create a password to secure your account",
        passwordLabel: "Password",
        passwordPlaceholder: "Min. 8 characters",
        confirmLabel: "Confirm password",
        confirmPlaceholder: "Repeat your password",
        submitButton: "Set password & sign in",
        submittingButton: "Setting password...",
    },
    callback: {
        loading: "Signing you in...",
    },
} as const;

export const SSO_ERROR_MESSAGES: Record<string, string> = {
    sso_failed: "Microsoft sign-in failed. Please try again.",
    no_email: "Your Microsoft account did not provide an email address.",
    account_not_found:
        "No account found for your email. Contact your administrator.",
    account_disabled:
        "Your account has been disabled. Contact your administrator.",
};