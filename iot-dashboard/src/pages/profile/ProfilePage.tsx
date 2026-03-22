// src/pages/profile/ProfilePage.tsx
// Current user profile — display and edit first_name, last_name, email, username (role read-only). Save via API and refresh store.

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { updateUser } from "@/api/users";
import { getMe } from "@/api/auth";
import { PROFILE_STRINGS, USER_STRINGS, UI_STRINGS } from "@/constants";
import { cn } from "@/lib/utils";

const ProfilePage = () => {
    const user = useAuthStore((s) => s.user);
    const setAuth = useAuthStore((s) => s.setAuth);
    const [firstName, setFirstName] = useState(user?.first_name ?? "");
    const [lastName, setLastName] = useState(user?.last_name ?? "");
    const [email, setEmail] = useState(user?.email ?? "");
    const [username, setUsername] = useState(user?.username ?? "");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setFirstName(user.first_name);
            setLastName(user.last_name);
            setEmail(user.email);
            setUsername(user.username ?? "");
        }
    }, [user]);

    const handleSubmit = useCallback(async () => {
        if (!user) return;
        const first = firstName.trim();
        const last = lastName.trim();
        const em = email.trim();
        if (!first || !last || !em) return;
        setSubmitting(true);
        try {
            await updateUser(user.id, {
                first_name: first,
                last_name: last,
                email: em,
                username: username.trim() || null,
            });
            const me = await getMe();
            setAuth(
                {
                    ...me.user,
                    features: me.features,
                    networks: me.networks,
                },
                me.permissions
            );
            toast.success(PROFILE_STRINGS.PROFILE_UPDATED);
        } catch {
            toast.error(PROFILE_STRINGS.ERROR_UPDATE);
        } finally {
            setSubmitting(false);
        }
    }, [user, firstName, lastName, email, username, setAuth]);

    if (!user) {
        return (
            <div className="text-muted-foreground dark:text-muted-foreground">
                {UI_STRINGS.LOADING}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground dark:text-foreground">
                    {PROFILE_STRINGS.TITLE}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
                    {PROFILE_STRINGS.SUBTITLE}
                </p>
            </div>

            <Card className="border-border bg-card dark:border-border dark:bg-card">
                <CardHeader>
                    <CardTitle className="text-foreground dark:text-foreground">
                        {PROFILE_STRINGS.EDIT_PROFILE}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="profile-first-name">{USER_STRINGS.FIRST_NAME}</Label>
                        <Input
                            id="profile-first-name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="bg-background dark:bg-background"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="profile-last-name">{USER_STRINGS.LAST_NAME}</Label>
                        <Input
                            id="profile-last-name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="bg-background dark:bg-background"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="profile-email">{USER_STRINGS.EMAIL}</Label>
                        <Input
                            id="profile-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-background dark:bg-background"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="profile-username">{USER_STRINGS.USERNAME}</Label>
                        <Input
                            id="profile-username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder={UI_STRINGS.N_A}
                            className="bg-background dark:bg-background"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>{USER_STRINGS.ROLE}</Label>
                        <p
                            className={cn(
                                "rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground dark:border-input dark:bg-muted/50 dark:text-muted-foreground"
                            )}
                        >
                            {user.role?.name ?? USER_STRINGS.NO_ROLE}
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <Label>{USER_STRINGS.COMPANY}</Label>
                        <p
                            className={cn(
                                "rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground dark:border-input dark:bg-muted/50 dark:text-muted-foreground"
                            )}
                        >
                            {user.company?.name ?? USER_STRINGS.NO_COMPANY}
                        </p>
                    </div>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {UI_STRINGS.SAVE}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfilePage;
