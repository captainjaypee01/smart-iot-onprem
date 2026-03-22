import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { FeatureGroup, CreateFeaturePayload } from "@/types/feature";
import { FEATURE_MODULE_STRINGS, UI_STRINGS } from "@/constants/strings";
import { useCreateFeature } from "@/hooks/useFeatureAdmin";
import { cn } from "@/lib/utils";
import LucideIconPicker from "@/components/shared/LucideIconPicker";

interface FeatureCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groups: FeatureGroup[];
    onSuccess: () => void;
}

const NEW_GROUP_VALUE = "__new__";

const readOnlyCodeClass =
    "font-mono text-xs rounded bg-muted px-2 py-1 text-foreground dark:bg-muted dark:text-foreground";

function calcMaxGroupOrder(groups: FeatureGroup[]): number {
    const values = groups
        .map((g) => g.features[0]?.group_order)
        .filter((v): v is number => typeof v === "number");

    if (values.length === 0) return 0;
    return Math.max(...values);
}

function calcNextSortOrder(group: FeatureGroup | undefined): number {
    if (!group || group.features.length === 0) return 0;
    return Math.max(...group.features.map((f) => f.sort_order)) + 1;
}

export default function FeatureCreateDialog({
    open,
    onOpenChange,
    groups,
    onSuccess,
}: FeatureCreateDialogProps) {
    const { mutate, isSubmitting } = useCreateFeature();

    const [selectedGroupKey, setSelectedGroupKey] = useState<string>(() => {
        const firstExisting = groups[0]?.group;
        return firstExisting ?? NEW_GROUP_VALUE;
    });
    const [newGroupKey, setNewGroupKey] = useState<string>("");
    const [newGroupOrder, setNewGroupOrder] = useState<number>(() => calcMaxGroupOrder(groups) + 1);

    const [key, setKey] = useState<string>("");
    const [route, setRoute] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [icon, setIcon] = useState<string>("");
    const [isActive, setIsActive] = useState<boolean>(true);

    const [sortOrder, setSortOrder] = useState<number>(() => calcNextSortOrder(groups[0]));

    const selectedExistingGroup = useMemo(
        () => groups.find((g) => g.group === selectedGroupKey),
        [groups, selectedGroupKey],
    );

    const existingGroupOrder = selectedExistingGroup?.features[0]?.group_order ?? 0;
    const maxGroupOrder = useMemo(() => calcMaxGroupOrder(groups), [groups]);

    const handleSelectGroup = (value: string): void => {
        setSelectedGroupKey(value);

        if (value === NEW_GROUP_VALUE) {
            setNewGroupOrder(maxGroupOrder + 1);
            setSortOrder(0);
            return;
        }

        const group = groups.find((g) => g.group === value);
        setSortOrder(calcNextSortOrder(group));
    };

    const handleSubmit = async (): Promise<void> => {
        const trimmedKey = key.trim();
        const trimmedRoute = route.trim();
        const trimmedName = name.trim();
        const trimmedIcon = icon.trim();

        const group =
            selectedGroupKey === NEW_GROUP_VALUE ? newGroupKey.trim() : selectedGroupKey;

        if (!trimmedKey || !trimmedRoute || !trimmedName) {
            toast.error(FEATURE_MODULE_STRINGS.ERROR_CREATE_MISSING_FIELDS);
            return;
        }

        if (selectedGroupKey === NEW_GROUP_VALUE && !group) {
            toast.error(FEATURE_MODULE_STRINGS.ERROR_CREATE_MISSING_GROUP_KEY);
            return;
        }

        const groupOrder =
            selectedGroupKey === NEW_GROUP_VALUE ? newGroupOrder : existingGroupOrder;

        const payload: CreateFeaturePayload = {
            key: trimmedKey,
            name: trimmedName,
            group,
            group_order: groupOrder,
            route: trimmedRoute,
            icon: trimmedIcon ? trimmedIcon : null,
            sort_order: sortOrder,
            is_active: isActive,
        };

        try {
            await mutate(payload);
            toast.success(FEATURE_MODULE_STRINGS.SUCCESS_CREATE);
            onSuccess();
            onOpenChange(false);
        } catch {
            toast.error(FEATURE_MODULE_STRINGS.ERROR_CREATE);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    "flex w-full max-w-2xl max-h-[90vh] flex-col gap-0 overflow-hidden p-0",
                    "border-border bg-background dark:border-border dark:bg-background",
                )}
            >
                <DialogHeader className="shrink-0 border-b border-border px-6 py-4 dark:border-border">
                    <DialogTitle className="text-foreground dark:text-foreground">
                        {FEATURE_MODULE_STRINGS.DIALOG_CREATE_TITLE}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="feature-create-key">{FEATURE_MODULE_STRINGS.LABEL_KEY}</Label>
                            <Input
                                id="feature-create-key"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                placeholder={FEATURE_MODULE_STRINGS.PLACEHOLDER_KEY}
                                className="bg-background font-mono text-sm dark:bg-background"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="feature-create-route">{FEATURE_MODULE_STRINGS.LABEL_ROUTE}</Label>
                            <Input
                                id="feature-create-route"
                                value={route}
                                onChange={(e) => setRoute(e.target.value)}
                                placeholder={FEATURE_MODULE_STRINGS.PLACEHOLDER_ROUTE}
                                className="bg-background font-mono text-sm dark:bg-background"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="feature-create-name">{FEATURE_MODULE_STRINGS.LABEL_NAME}</Label>
                            <Input
                                id="feature-create-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={FEATURE_MODULE_STRINGS.PLACEHOLDER_NAME}
                                className="bg-background text-sm dark:bg-background"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="feature-create-icon">{FEATURE_MODULE_STRINGS.LABEL_ICON}</Label>
                            <LucideIconPicker
                                value={icon}
                                onChange={setIcon}
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                                {icon.trim() ? icon.trim() : UI_STRINGS.N_A}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{FEATURE_MODULE_STRINGS.LABEL_GROUP}</Label>
                            <Select
                                value={selectedGroupKey}
                                onValueChange={(v) => handleSelectGroup(v)}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger className="bg-background dark:bg-background">
                                    <SelectValue placeholder={FEATURE_MODULE_STRINGS.PLACEHOLDER_GROUP} />
                                </SelectTrigger>
                                <SelectContent className="bg-card dark:bg-card">
                                    {groups.map((g) => (
                                        <SelectItem key={g.group} value={g.group}>
                                            {g.label}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value={NEW_GROUP_VALUE}>
                                        {FEATURE_MODULE_STRINGS.NEW_GROUP_OPTION}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                                {FEATURE_MODULE_STRINGS.GROUP_LABEL_NOTE}
                            </p>
                        </div>

                        {selectedGroupKey === NEW_GROUP_VALUE ? (
                            <div className="space-y-2">
                                <Label htmlFor="feature-create-new-group-key">
                                    {FEATURE_MODULE_STRINGS.LABEL_NEW_GROUP_KEY}
                                </Label>
                                <Input
                                    id="feature-create-new-group-key"
                                    value={newGroupKey}
                                    onChange={(e) => setNewGroupKey(e.target.value)}
                                    placeholder={FEATURE_MODULE_STRINGS.PLACEHOLDER_NEW_GROUP_KEY}
                                    className="bg-background font-mono text-sm dark:bg-background"
                                    disabled={isSubmitting}
                                />
                                <Label htmlFor="feature-create-group-order" className="mt-3">
                                    {FEATURE_MODULE_STRINGS.LABEL_GROUP_ORDER}
                                </Label>
                                <Input
                                    id="feature-create-group-order"
                                    type="number"
                                    value={newGroupOrder}
                                    onChange={(e) => setNewGroupOrder(Number.parseInt(e.target.value || "0", 10))}
                                    className="bg-background dark:bg-background"
                                    min={0}
                                    disabled={isSubmitting}
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="feature-create-existing-group-order">
                                    {FEATURE_MODULE_STRINGS.LABEL_GROUP_ORDER}
                                </Label>
                                <Input
                                    id="feature-create-existing-group-order"
                                    value={existingGroupOrder}
                                    className="bg-background font-mono text-sm dark:bg-background"
                                    disabled
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="feature-create-sort-order">{FEATURE_MODULE_STRINGS.LABEL_SORT_ORDER}</Label>
                            <Input
                                id="feature-create-sort-order"
                                type="number"
                                value={sortOrder}
                                onChange={(e) =>
                                    setSortOrder(Number.parseInt(e.target.value || "0", 10))
                                }
                                className="bg-background dark:bg-background"
                                min={0}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2 dark:border-border">
                            <Label htmlFor="feature-create-active" className="text-foreground dark:text-foreground">
                                {FEATURE_MODULE_STRINGS.LABEL_ACTIVE}
                            </Label>
                            <Switch
                                id="feature-create-active"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                            {FEATURE_MODULE_STRINGS.GROUP_CREATE_HELP}
                        </div>
                        {selectedGroupKey !== NEW_GROUP_VALUE ? (
                            <div>
                                <code className={readOnlyCodeClass}>
                                    {selectedExistingGroup?.group ?? selectedGroupKey}
                                </code>
                            </div>
                        ) : (
                            <div>
                                {newGroupKey ? (
                                    <code className={readOnlyCodeClass}>{newGroupKey}</code>
                                ) : (
                                    <code className={readOnlyCodeClass}>—</code>
                                )}
                            </div>
                        )}
                    </div>
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
}

