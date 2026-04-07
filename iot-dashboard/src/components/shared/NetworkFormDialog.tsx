// src/components/shared/NetworkFormDialog.tsx
// Dialog for creating and editing Networks with four configuration sections.

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGenerateAddress } from "@/hooks/useNetworks";
import { useNodeTypeOptions } from "@/hooks/useNodeTypes";
import { createNetwork, updateNetwork } from "@/api/networks";
import type {
    Network,
    StoreNetworkPayload,
    UpdateNetworkPayload,
    DiagnosticInterval,
    AlarmThresholdUnit,
    WirepasVersion,
} from "@/types/network";
import {
    DIAGNOSTIC_INTERVAL_OPTIONS,
    ALARM_THRESHOLD_UNIT_OPTIONS,
    WIREPAS_VERSION_OPTIONS,
} from "@/constants/nodeTypes";
import { NETWORK_STRINGS, UI_STRINGS } from "@/constants/strings";

export interface NetworkFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    network?: Network;
    onSuccess: () => void;
}

const ADDRESS_REGEX = /^[0-9A-Fa-f]{6}$/i;

export const NetworkFormDialog = ({
    open,
    onOpenChange,
    network,
    onSuccess,
}: NetworkFormDialogProps) => {
    const isEditMode = network !== undefined;

    const [name, setName] = useState<string>("");
    const [networkAddress, setNetworkAddress] = useState<string>("");
    const [addressError, setAddressError] = useState<string | null>(null);
    const [description, setDescription] = useState<string>("");
    const [remarks, setRemarks] = useState<string>("");
    const [isActive, setIsActive] = useState<boolean>(true);

    const [diagnosticInterval, setDiagnosticInterval] = useState<DiagnosticInterval>(30);
    const [alarmThreshold, setAlarmThreshold] = useState<number>(5);
    const [alarmUnit, setAlarmUnit] = useState<AlarmThresholdUnit>("minutes");
    const [wirepasVersion, setWirepasVersion] = useState<WirepasVersion | null>(null);
    const [commissionedDate, setCommissionedDate] = useState<string>("");

    const [isMaintenance, setIsMaintenance] = useState<boolean>(false);
    const [maintenanceStart, setMaintenanceStart] = useState<string>("");
    const [maintenanceEnd, setMaintenanceEnd] = useState<string>("");
    const [maintenanceError, setMaintenanceError] = useState<string | null>(null);

    const [hasMonthlyReport, setHasMonthlyReport] = useState<boolean>(false);

    const [selectedNodeTypeIds, setSelectedNodeTypeIds] = useState<number[]>([]);

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const { generate, isGenerating } = useGenerateAddress();
    const { options: nodeTypeOptions } = useNodeTypeOptions();

    useEffect(() => {
        if (open) {
            if (network) {
                setName(network.name);
                setNetworkAddress(network.network_address);
                setDescription(network.description ?? "");
                setRemarks(network.remarks ?? "");
                setIsActive(network.is_active);
                setDiagnosticInterval(network.diagnostic_interval);
                setAlarmThreshold(network.alarm_threshold);
                setAlarmUnit(network.alarm_threshold_unit);
                setWirepasVersion(network.wirepas_version);
                setCommissionedDate(network.commissioned_date ?? "");
                setIsMaintenance(network.is_maintenance);
                setMaintenanceStart(network.maintenance_start_at ?? "");
                setMaintenanceEnd(network.maintenance_end_at ?? "");
                setHasMonthlyReport(network.has_monthly_report);
                setSelectedNodeTypeIds(network.node_types.map((nt) => nt.id));
            } else {
                setName("");
                setNetworkAddress("");
                setDescription("");
                setRemarks("");
                setIsActive(true);
                setDiagnosticInterval(30);
                setAlarmThreshold(5);
                setAlarmUnit("minutes");
                setWirepasVersion(null);
                setCommissionedDate("");
                setIsMaintenance(false);
                setMaintenanceStart("");
                setMaintenanceEnd("");
                setHasMonthlyReport(false);
                setSelectedNodeTypeIds([]);
            }
            setAddressError(null);
            setMaintenanceError(null);
        }
    }, [open, network]);

    const handleBlurAddress = useCallback(() => {
        const value = networkAddress.trim();
        if (value === "" || !ADDRESS_REGEX.test(value)) {
            setAddressError(NETWORK_STRINGS.ADDRESS_INVALID);
        } else {
            setAddressError(null);
        }
    }, [networkAddress]);

    const hasInvalidMaintenanceRange = useMemo(() => {
        if (!isMaintenance || maintenanceStart === "" || maintenanceEnd === "") {
            return false;
        }
        const start = new Date(maintenanceStart);
        const end = new Date(maintenanceEnd);
        // end must be strictly after start
        return !(end.getTime() > start.getTime());
    }, [isMaintenance, maintenanceStart, maintenanceEnd]);

    useEffect(() => {
        if (hasInvalidMaintenanceRange) {
            setMaintenanceError(NETWORK_STRINGS.MAINTENANCE_INVALID_RANGE);
        } else {
            setMaintenanceError(null);
        }
    }, [hasInvalidMaintenanceRange]);

    const toggleNodeType = (id: number, checked: boolean) => {
        setSelectedNodeTypeIds((prev) => {
            if (checked) {
                if (prev.includes(id)) return prev;
                return [...prev, id];
            }
            return prev.filter((existingId) => existingId !== id);
        });
    };

    const handleGenerateAddress = async () => {
        const result = await generate();
        if (result) {
            setNetworkAddress(result);
            setAddressError(null);
        } else {
            toast.error(NETWORK_STRINGS.SAVE_ERROR);
        }
    };

    const buildPayload = (): StoreNetworkPayload | UpdateNetworkPayload => {
        const base = {
            name: name.trim(),
            network_address: networkAddress.trim(),
            description: description.trim() === "" ? null : description.trim(),
            remarks: remarks.trim() === "" ? null : remarks.trim(),
            is_active: isActive,
            diagnostic_interval: diagnosticInterval,
            alarm_threshold: alarmThreshold,
            alarm_threshold_unit: alarmUnit,
            wirepas_version: wirepasVersion,
            commissioned_date: commissionedDate === "" ? null : commissionedDate,
            is_maintenance: isMaintenance,
            maintenance_start_at:
                isMaintenance && maintenanceStart !== "" ? maintenanceStart : null,
            maintenance_end_at:
                isMaintenance && maintenanceEnd !== "" ? maintenanceEnd : null,
            has_monthly_report: hasMonthlyReport,
            node_types: selectedNodeTypeIds,
        };

        return base;
    };

    const handleSubmit = async () => {
        if (networkAddress.trim() === "" || addressError !== null) {
            handleBlurAddress();
            return;
        }

        if (isMaintenance) {
            if (maintenanceStart === "" || maintenanceEnd === "") {
                setMaintenanceError(NETWORK_STRINGS.MAINTENANCE_INVALID_RANGE);
                return;
            }
            if (hasInvalidMaintenanceRange) {
                return;
            }
        }

        const payload = buildPayload();

        setIsSubmitting(true);
        try {
            if (isEditMode && network) {
                await updateNetwork(network.id, payload as UpdateNetworkPayload);
                toast.success(NETWORK_STRINGS.SAVE_SUCCESS_UPDATE);
            } else {
                await createNetwork(payload as StoreNetworkPayload);
                toast.success(NETWORK_STRINGS.SAVE_SUCCESS_CREATE);
            }
            onSuccess();
            onOpenChange(false);
        } catch (errorUnknown) {
            const message =
                errorUnknown instanceof Error && errorUnknown.message
                    ? errorUnknown.message
                    : NETWORK_STRINGS.SAVE_ERROR;
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const title = isEditMode
        ? NETWORK_STRINGS.FORM_TITLE_EDIT
        : NETWORK_STRINGS.FORM_TITLE_CREATE;

    const isSubmitDisabled =
        isSubmitting || addressError !== null || maintenanceError !== null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-2xl max-h-[90vh] flex flex-col gap-0 bg-card text-card-foreground border-border dark:bg-card dark:text-card-foreground dark:border-border">
                <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="overflow-y-auto flex-1 px-6 pb-2 space-y-6">
                    {/* Section 1 — Basic Info */}
                    <section className="space-y-4">
                        <h2 className="text-sm font-semibold text-muted-foreground dark:text-muted-foreground">
                            {NETWORK_STRINGS.SUBTITLE}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="network-name">
                                    {NETWORK_STRINGS.LABEL_NAME}
                                </Label>
                                <Input
                                    id="network-name"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    className="bg-background text-foreground dark:bg-background dark:text-foreground"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="network-is-active"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                />
                                <Label htmlFor="network-is-active">
                                    {NETWORK_STRINGS.LABEL_IS_ACTIVE}
                                </Label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="network-address">
                                {NETWORK_STRINGS.LABEL_NETWORK_ADDRESS}
                            </Label>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                                <Input
                                    id="network-address"
                                    value={networkAddress}
                                    placeholder="e.g. A3F2B1"
                                    onChange={(event) => {
                                        // Strip any accidental 0x/0X prefix so users
                                        // never store or send it
                                        const raw = event.target.value;
                                        const stripped = raw.replace(/^0x/i, "");
                                        setNetworkAddress(stripped);
                                    }}
                                    onBlur={handleBlurAddress}
                                    className={cn(
                                        "bg-background text-foreground dark:bg-background dark:text-foreground font-mono",
                                        addressError &&
                                            "border-destructive text-destructive dark:border-destructive dark:text-destructive",
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex items-center justify-center gap-2"
                                    onClick={handleGenerateAddress}
                                    disabled={isGenerating}
                                >
                                    {isGenerating && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    {NETWORK_STRINGS.GENERATE_ADDRESS}
                                </Button>
                            </div>
                            {addressError && (
                                <p className="text-xs text-destructive dark:text-destructive">
                                    {addressError}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="network-description">
                                {NETWORK_STRINGS.LABEL_DESCRIPTION}
                            </Label>
                            <Textarea
                                id="network-description"
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                                className="bg-background text-foreground dark:bg-background dark:text-foreground"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="network-remarks">
                                {NETWORK_STRINGS.LABEL_REMARKS}
                            </Label>
                            <Textarea
                                id="network-remarks"
                                value={remarks}
                                onChange={(event) => setRemarks(event.target.value)}
                                className="bg-background text-foreground dark:bg-background dark:text-foreground"
                            />
                        </div>
                    </section>

                    {/* Section 2 — Configuration */}
                    <section className="space-y-4">
                        <h2 className="text-sm font-semibold text-muted-foreground dark:text-muted-foreground">
                            {NETWORK_STRINGS.LABEL_DIAGNOSTIC_INTERVAL}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="network-diagnostic-interval">
                                    {NETWORK_STRINGS.LABEL_DIAGNOSTIC_INTERVAL}
                                </Label>
                                <Select
                                    value={String(diagnosticInterval)}
                                    onValueChange={(value) =>
                                        setDiagnosticInterval(
                                            Number(value) as DiagnosticInterval,
                                        )
                                    }
                                >
                                    <SelectTrigger id="network-diagnostic-interval">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DIAGNOSTIC_INTERVAL_OPTIONS.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={String(option.value)}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{NETWORK_STRINGS.LABEL_ALARM_THRESHOLD}</Label>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                                    <Input
                                        type="number"
                                        min={1}
                                        value={alarmThreshold}
                                        onChange={(event) =>
                                            setAlarmThreshold(
                                                Number(event.target.value) || 1,
                                            )
                                        }
                                        className="bg-background text-foreground dark:bg-background dark:text-foreground"
                                    />
                                    <Select
                                        value={alarmUnit}
                                        onValueChange={(value) =>
                                            setAlarmUnit(
                                                value as AlarmThresholdUnit,
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ALARM_THRESHOLD_UNIT_OPTIONS.map(
                                                (option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{NETWORK_STRINGS.LABEL_WIREPAS_VERSION}</Label>
                                <Select
                                    value={wirepasVersion ?? "none"}
                                    onValueChange={(value) =>
                                        setWirepasVersion(
                                            value === "none"
                                                ? null
                                                : (value as WirepasVersion),
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            {UI_STRINGS.NONE}
                                        </SelectItem>
                                        {WIREPAS_VERSION_OPTIONS.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="network-commissioned-date">
                                    {NETWORK_STRINGS.LABEL_COMMISSIONED_DATE}
                                </Label>
                                <div className="relative">
                                    <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="network-commissioned-date"
                                        type="date"
                                        value={commissionedDate}
                                        onChange={(event) =>
                                            setCommissionedDate(event.target.value)
                                        }
                                        className="pl-9 bg-background text-foreground dark:bg-background dark:text-foreground"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 3 — Maintenance */}
                    <section className="space-y-4">
                        <h2 className="text-sm font-semibold text-muted-foreground dark:text-muted-foreground">
                            {NETWORK_STRINGS.LABEL_IS_MAINTENANCE}
                        </h2>
                        <div className="flex items-center gap-2">
                            <Switch
                                id="network-is-maintenance"
                                checked={isMaintenance}
                                onCheckedChange={setIsMaintenance}
                            />
                            <Label htmlFor="network-is-maintenance">
                                {NETWORK_STRINGS.LABEL_IS_MAINTENANCE}
                            </Label>
                        </div>
                        {isMaintenance && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="network-maintenance-start">
                                        {NETWORK_STRINGS.LABEL_MAINTENANCE_START}
                                    </Label>
                                    <Input
                                        id="network-maintenance-start"
                                        type="datetime-local"
                                        value={maintenanceStart}
                                        onChange={(event) =>
                                            setMaintenanceStart(event.target.value)
                                        }
                                        className="bg-background text-foreground dark:bg-background dark:text-foreground"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="network-maintenance-end">
                                        {NETWORK_STRINGS.LABEL_MAINTENANCE_END}
                                    </Label>
                                    <Input
                                        id="network-maintenance-end"
                                        type="datetime-local"
                                        value={maintenanceEnd}
                                        onChange={(event) =>
                                            setMaintenanceEnd(event.target.value)
                                        }
                                        className="bg-background text-foreground dark:bg-background dark:text-foreground"
                                    />
                                </div>
                                {maintenanceError && (
                                    <p className="col-span-1 sm:col-span-2 text-xs text-destructive dark:text-destructive">
                                        {maintenanceError}
                                    </p>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Section 4 — Reporting & Node Types */}
                    <section className="space-y-4">
                        <h2 className="text-sm font-semibold text-muted-foreground dark:text-muted-foreground">
                            {NETWORK_STRINGS.LABEL_HAS_MONTHLY_REPORT}
                        </h2>
                        <div className="flex items-center gap-2">
                            <Switch
                                id="network-monthly-report"
                                checked={hasMonthlyReport}
                                onCheckedChange={setHasMonthlyReport}
                            />
                            <Label htmlFor="network-monthly-report">
                                {NETWORK_STRINGS.LABEL_HAS_MONTHLY_REPORT}
                            </Label>
                        </div>
                        <div className="space-y-2">
                            <Label>{NETWORK_STRINGS.LABEL_NODE_TYPES}</Label>
                            <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-background p-2 dark:bg-background">
                                {nodeTypeOptions.length === 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        {UI_STRINGS.N_A}
                                    </p>
                                )}
                                {nodeTypeOptions.map((option) => {
                                    const checked = selectedNodeTypeIds.includes(
                                        option.id,
                                    );
                                    return (
                                        <label
                                            key={option.id}
                                            className="flex items-center justify-between gap-3 rounded-md px-2 py-1 text-sm hover:bg-muted dark:hover:bg-muted"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={checked}
                                                    onCheckedChange={(value) =>
                                                        toggleNodeType(
                                                            option.id,
                                                            Boolean(value),
                                                        )
                                                    }
                                                />
                                                <span>{option.name}</span>
                                            </div>
                                            <span className="font-mono text-xs text-muted-foreground">
                                                {option.area_id}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                </div>

                <DialogFooter className="px-6 py-4 shrink-0 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {UI_STRINGS.CANCEL}
                    </Button>
                    <Button
                        type="button"
                        disabled={isSubmitDisabled}
                        onClick={() => {
                            void handleSubmit();
                        }}
                    >
                        {isSubmitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {UI_STRINGS.SAVE}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default NetworkFormDialog;

