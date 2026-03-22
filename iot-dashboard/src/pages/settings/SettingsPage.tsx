// src/pages/settings/SettingsPage.tsx
// App settings — session duration and other per-company settings. Superadmin selects company once at the top; all sections use that context. Company admin edits their own company.

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getSessionSettings, updateSessionSettings, type CompanyOption } from "@/api/settings";
import { useAuthStore } from "@/store/authStore";
import { NAVBAR_STRINGS, SETTINGS_STRINGS } from "@/constants";

const SESSION_DURATION_PRESETS: { value: string; label: string }[] = [
    { value: "15", label: "15 minutes" },
    { value: "30", label: "30 minutes" },
    { value: "60", label: "1 hour" },
    { value: "120", label: "2 hours" },
    { value: "480", label: "8 hours" },
    { value: "1440", label: "24 hours" },
    { value: "10080", label: "7 days" },
    { value: "43200", label: "30 days" },
    { value: "unlimited", label: "Unlimited" },
];

function sessionDurationOptions(currentValue: string): { value: string; label: string }[] {
    const presets = [...SESSION_DURATION_PRESETS];
    if (
        currentValue &&
        currentValue !== "unlimited" &&
        !presets.some((p) => p.value === currentValue)
    ) {
        const n = parseInt(currentValue, 10);
        if (!Number.isNaN(n) && n > 0) {
            presets.push({ value: currentValue, label: `${n} minutes (current)` });
            presets.sort((a, b) => {
                if (a.value === "unlimited") return 1;
                if (b.value === "unlimited") return -1;
                return parseInt(a.value, 10) - parseInt(b.value, 10);
            });
        }
    }
    return presets;
}

function parseSessionLifetime(data: {
    session_lifetime_minutes: string;
    effective_minutes: number;
}): string {
    const v = data.session_lifetime_minutes;
    const effective = data.effective_minutes;
    if (
        v === "unlimited" ||
        v === "forever" ||
        v === "5256000" ||
        effective >= 5256000
    ) {
        return "unlimited";
    }
    return String(v);
}

const SettingsPage = () => {
    const user = useAuthStore((s) => s.user);
    const isSuperadmin = user?.is_superadmin ?? false;
    const [companies, setCompanies] = useState<CompanyOption[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
    const [sessionLifetime, setSessionLifetime] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [forbidden, setForbidden] = useState(false);

    const fetchSettings = useCallback(
        (companyId?: number | null) => {
            setLoading(true);
            getSessionSettings(companyId)
                .then((data) => {
                    setCompanies(data.companies ?? []);
                    if (data.company_id != null) {
                        setSelectedCompanyId(data.company_id);
                    }
                    setSessionLifetime(parseSessionLifetime(data));
                })
                .catch((err: { response?: { status: number } }) => {
                    if (err.response?.status === 403) {
                        setForbidden(true);
                    } else {
                        toast.error("Failed to load settings.");
                    }
                })
                .finally(() => setLoading(false));
        },
        []
    );

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // When superadmin changes the page-level company, refetch settings for that company so all sections show the right data
    const handleCompanyChange = (value: string) => {
        const id = parseInt(value, 10);
        if (Number.isNaN(id)) return;
        setSelectedCompanyId(id);
        setLoading(true);
        getSessionSettings(id)
            .then((data) => setSessionLifetime(parseSessionLifetime(data)))
            .catch(() => toast.error("Failed to load settings for this company."))
            .finally(() => setLoading(false));
    };

    const handleSessionDurationChange = (value: string) => {
        setSessionLifetime(value);
    };

    const handleSaveSessionDuration = () => {
        if (isSuperadmin && selectedCompanyId === null) return;
        setSaving(true);
        const payload: { session_lifetime_minutes: string; company_id?: number } = {
            session_lifetime_minutes: sessionLifetime,
        };
        if (isSuperadmin && selectedCompanyId != null) {
            payload.company_id = selectedCompanyId;
        }
        updateSessionSettings(payload)
            .then(() => {
                toast.success(
                    isSuperadmin
                        ? "Session duration updated for this company."
                        : "Session duration updated. New logins will use this value."
                );
            })
            .catch(() => {
                toast.error("Failed to update session duration.");
            })
            .finally(() => setSaving(false));
    };

    if (loading && companies.length === 0 && !forbidden) {
        return (
            <div className="flex h-48 items-center justify-center">
                <div className="border-brand-blue h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
            </div>
        );
    }

    if (forbidden) {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-bold tracking-tight">
                    {NAVBAR_STRINGS.SESSION_SETTINGS}
                </h1>
                <Card>
                    <CardHeader>
                        <CardTitle>{SETTINGS_STRINGS.FORBIDDEN_TITLE}</CardTitle>
                        <CardDescription>{SETTINGS_STRINGS.FORBIDDEN_DESCRIPTION}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">{NAVBAR_STRINGS.SESSION_SETTINGS}</h1>

            {/* Superadmin: select company once at the top; all sections below use this context */}
            {isSuperadmin && companies.length > 0 && (
                <Card className="max-w-xl">
                    <CardHeader>
                        <CardTitle>Company</CardTitle>
                        <CardDescription>
                            Choose which company’s settings you are viewing and editing. All sections below apply to this company.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="settings-company">Company</Label>
                            <Select
                                value={
                                    selectedCompanyId != null
                                        ? String(selectedCompanyId)
                                        : ""
                                }
                                onValueChange={handleCompanyChange}
                                disabled={loading}
                            >
                                <SelectTrigger id="settings-company" className="w-full max-w-xs">
                                    <SelectValue placeholder="Select company" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name} ({c.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Section: Session duration — uses page-level selected company for superadmin */}
            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle>Session duration</CardTitle>
                    <CardDescription>
                        {isSuperadmin
                            ? "Set how long users stay logged in when idle for the selected company. New logins for that company will use this value."
                            : "Set how long users in your company stay logged in when idle. New logins will use this value."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="session-duration">Duration</Label>
                        <Select
                            value={sessionLifetime}
                            onValueChange={handleSessionDurationChange}
                            disabled={isSuperadmin && selectedCompanyId === null}
                        >
                            <SelectTrigger id="session-duration" className="w-full max-w-xs">
                                <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                                {sessionDurationOptions(sessionLifetime).map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        onClick={handleSaveSessionDuration}
                        disabled={saving || (isSuperadmin && selectedCompanyId === null)}
                    >
                        {saving ? "Saving…" : "Save"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default SettingsPage;
