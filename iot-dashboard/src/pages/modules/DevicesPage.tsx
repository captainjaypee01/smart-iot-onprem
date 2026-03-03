// src/pages/modules/DevicesPage.tsx
// Devices module page — list and manage IoT devices

import type { FC } from "react";

const DevicesPage: FC = () => {
    return (
        <div className="flex min-h-screen flex-col bg-background px-6 py-8">
            <header className="mb-6">
                <h1 className="text-2xl font-semibold text-foreground">Devices</h1>
                <p className="text-sm text-muted-foreground">
                    View and manage devices connected to your IoT deployment.
                </p>
            </header>

            <main className="flex flex-1 items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    Device table and details will be available here soon.
                </p>
            </main>
        </div>
    );
};

export default DevicesPage;

