// src/pages/dashboard/DashboardPage.tsx
// Main dashboard page — high-level overview of devices and alerts

import type { FC } from "react";

const DashboardPage: FC = () => {
    return (
        <div className="flex min-h-screen flex-col bg-background px-6 py-8">
            <header className="mb-6">
                <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                    High-level overview of your IoT environment will appear here.
                </p>
            </header>

            <main className="flex flex-1 items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    Dashboard widgets and charts are coming soon.
                </p>
            </main>
        </div>
    );
};

export default DashboardPage;

