// src/components/shared/FeatureEditDialog.tsx
// Superadmin: edit feature display name, Lucide icon name, and active flag.

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FEATURE_MODULE_STRINGS, UI_STRINGS } from "@/constants/strings";
import { useUpdateFeature } from "@/hooks/useFeatureAdmin";
import type { Feature } from "@/types/feature";
import { cn } from "@/lib/utils";
import LucideIconPicker from "@/components/shared/LucideIconPicker";

interface FeatureEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    feature?: Feature;
    onSuccess: () => void;
}

const readOnlyCodeClass =
    "font-mono text-xs rounded bg-muted px-2 py-1 text-foreground dark:bg-muted dark:text-foreground";

const FeatureEditDialog = ({
    open,
    onOpenChange,
    feature,
    onSuccess,
}: FeatureEditDialogProps) => {
    const { mutate, isSubmitting } = useUpdateFeature();
    const [name, setName] = useState(() => feature?.name ?? "");
    const [icon, setIcon] = useState(() => feature?.icon ?? "");
    const [isActive, setIsActive] = useState(() => feature?.is_active ?? true);

    const handleSubmit = async () => {
        if (!feature) return;
        try {
            await mutate(feature.id, {
                name: name.trim(),
                icon: icon.trim() ? icon.trim() : null,
                is_active: isActive,
            });
            toast.success(FEATURE_MODULE_STRINGS.SUCCESS_UPDATE);
            onSuccess();
            onOpenChange(false);
        } catch {
            toast.error(FEATURE_MODULE_STRINGS.ERROR_UPDATE);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    "flex max-h-[90vh] w-full max-w-md flex-col gap-0 overflow-hidden p-0",
                    "border-border bg-background dark:border-border dark:bg-background",
                )}
            >
                <DialogHeader className="shrink-0 border-b border-border px-6 py-4 dark:border-border">
                    <DialogTitle className="text-foreground dark:text-foreground">
                        {FEATURE_MODULE_STRINGS.DIALOG_EDIT_TITLE}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
                    {feature && (
                        <>
                            <div className="grid gap-2">
                                <span className="text-sm font-medium text-foreground dark:text-foreground">
                                    {FEATURE_MODULE_STRINGS.LABEL_KEY}
                                </span>
                                <code className={readOnlyCodeClass}>{feature.key}</code>
                            </div>
                            <div className="grid gap-2">
                                <span className="text-sm font-medium text-foreground dark:text-foreground">
                                    {FEATURE_MODULE_STRINGS.LABEL_ROUTE}
                                </span>
                                <code className={readOnlyCodeClass}>{feature.route}</code>
                            </div>
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="feature-edit-name"
                                    className="text-foreground dark:text-foreground"
                                >
                                    {FEATURE_MODULE_STRINGS.LABEL_NAME}
                                </Label>
                                <Input
                                    id="feature-edit-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-background dark:bg-background"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="feature-edit-icon"
                                    className="text-foreground dark:text-foreground"
                                >
                                    {FEATURE_MODULE_STRINGS.LABEL_ICON}
                                </Label>
                                <LucideIconPicker value={icon} onChange={setIcon} />
                            </div>
                            <div className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-2 dark:border-border">
                                <Label
                                    htmlFor="feature-edit-active"
                                    className="text-foreground dark:text-foreground"
                                >
                                    {FEATURE_MODULE_STRINGS.LABEL_ACTIVE}
                                </Label>
                                <Switch
                                    id="feature-edit-active"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                />
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4 dark:border-border sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                        className="dark:border-border"
                    >
                        {UI_STRINGS.CANCEL}
                    </Button>
                    <Button
                        type="button"
                        onClick={() => void handleSubmit()}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                        ) : null}
                        {UI_STRINGS.SAVE}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FeatureEditDialog;
