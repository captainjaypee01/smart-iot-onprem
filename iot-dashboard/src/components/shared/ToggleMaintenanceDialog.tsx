// src/components/shared/ToggleMaintenanceDialog.tsx
// Dialog for toggling a network's maintenance window on or off.

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { Network } from "@/types/network";
import { useToggleMaintenance } from "@/hooks/useNetworks";
import { NETWORK_STRINGS, UI_STRINGS } from "@/constants/strings";

export interface ToggleMaintenanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    network: Network;
    onSuccess: () => void;
}

export const ToggleMaintenanceDialog = ({
    open,
    onOpenChange,
    network,
    onSuccess,
}: ToggleMaintenanceDialogProps) => {
    const isCurrentlyOn = network.is_maintenance;
    const { toggle } = useToggleMaintenance();

    const [start, setStart] = useState<string>("");
    const [end, setEnd] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);

    useEffect(() => {
        if (open && !isCurrentlyOn) {
            setStart("");
            setEnd("");
            setError(null);
        }
    }, [open, isCurrentlyOn]);

    const hasInvalidRange = useMemo(() => {
        if (isCurrentlyOn) return false;
        if (start === "" || end === "") return false;
        const startDate = new Date(start);
        const endDate = new Date(end);
        return !(endDate.getTime() > startDate.getTime());
    }, [isCurrentlyOn, start, end]);

    useEffect(() => {
        if (hasInvalidRange) {
            setError(NETWORK_STRINGS.MAINTENANCE_INVALID_RANGE);
        } else {
            setError(null);
        }
    }, [hasInvalidRange]);

    const handleSubmit = async () => {
        if (!network) return;

        if (!isCurrentlyOn) {
            if (start === "" || end === "") {
                setError(NETWORK_STRINGS.MAINTENANCE_INVALID_RANGE);
                return;
            }
            if (hasInvalidRange) return;
        }

        setSubmitting(true);
        try {
            if (!isCurrentlyOn) {
                await toggle(network.id, {
                    is_maintenance: true,
                    maintenance_start_at: start,
                    maintenance_end_at: end,
                });
            } else {
                await toggle(network.id, {
                    is_maintenance: false,
                });
            }
            toast.success(NETWORK_STRINGS.SAVE_SUCCESS_UPDATE);
            onSuccess();
            onOpenChange(false);
        } catch (errorUnknown) {
            const message =
                errorUnknown instanceof Error && errorUnknown.message
                    ? errorUnknown.message
                    : NETWORK_STRINGS.SAVE_ERROR;
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const isSubmitDisabled = submitting || (!!error && !isCurrentlyOn);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-card text-card-foreground border-border dark:bg-card dark:text-card-foreground dark:border-border">
                <DialogHeader>
                    <DialogTitle>{NETWORK_STRINGS.TOGGLE_ACTION_LABEL}</DialogTitle>
                </DialogHeader>

                {!isCurrentlyOn ? (
                    <div className="grid gap-4">
                        <p className="text-sm text-muted-foreground">
                            {NETWORK_STRINGS.LABEL_IS_MAINTENANCE}
                        </p>
                        <div className="grid gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="toggle-maintenance-start">
                                    {NETWORK_STRINGS.LABEL_MAINTENANCE_START}
                                </Label>
                                <Input
                                    id="toggle-maintenance-start"
                                    type="datetime-local"
                                    value={start}
                                    onChange={(event) => setStart(event.target.value)}
                                    className="bg-background text-foreground dark:bg-background dark:text-foreground"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="toggle-maintenance-end">
                                    {NETWORK_STRINGS.LABEL_MAINTENANCE_END}
                                </Label>
                                <Input
                                    id="toggle-maintenance-end"
                                    type="datetime-local"
                                    value={end}
                                    onChange={(event) => setEnd(event.target.value)}
                                    className="bg-background text-foreground dark:bg-background dark:text-foreground"
                                />
                            </div>
                            {error && (
                                <p className="text-xs text-destructive dark:text-destructive">
                                    {error}
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        {NETWORK_STRINGS.TOGGLE_OFF_CONFIRM}
                    </p>
                )}

                <div className="mt-4 flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        {UI_STRINGS.CANCEL}
                    </Button>
                    <Button
                        type="button"
                        onClick={() => {
                            void handleSubmit();
                        }}
                        disabled={isSubmitDisabled}
                    >
                        {UI_STRINGS.CONFIRM}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ToggleMaintenanceDialog;

