// src/pages/errors/ForbiddenPage.tsx

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AUTH_UI_STRINGS, PROFILE_STRINGS, NAVBAR_STRINGS } from "@/constants";
import { useAuth } from "@/hooks/useAuth";

const ForbiddenPage = () => {
    const navigate = useNavigate();
    const { handleLogout } = useAuth();

    return (
        <div className="bg-background flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 p-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground dark:text-foreground">
                {AUTH_UI_STRINGS.LOGIN_RESTRICTED}
            </h1>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button variant="secondary" onClick={() => navigate("/profile")}>
                    {PROFILE_STRINGS.EDIT_PROFILE}
                </Button>

                <Button
                    variant="destructive"
                    onClick={() => {
                        void handleLogout();
                    }}
                >
                    {NAVBAR_STRINGS.SIGN_OUT}
                </Button>
            </div>
        </div>
    );
};

export default ForbiddenPage;

