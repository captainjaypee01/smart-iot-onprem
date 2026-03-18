// src/components/shared/NodeTypeFormDialog.tsx
// Dialog for creating and editing Node Types with basic info and sensor slots.

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { X } from "lucide-react";
import { createNodeType, updateNodeType } from "@/api/nodeTypes";
import type { NodeType, SensorSlotPayload, StoreNodeTypePayload, UpdateNodeTypePayload } from "@/types/nodeType";
import { NODE_TYPE_STRINGS, UI_STRINGS } from "@/constants/strings";

interface NodeTypeFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    nodeType?: NodeType;
    onSuccess: () => void;
}

interface SensorRowState {
    name: string;
    unit: string;
}

const AREA_ID_REGEX = /^[0-9A-Fa-f]{1,10}$/i;

export const NodeTypeFormDialog = ({
    open,
    onOpenChange,
    nodeType,
    onSuccess,
}: NodeTypeFormDialogProps) => {
    const isEditMode = nodeType !== undefined;

    const [name, setName] = useState<string>("");
    const [areaId, setAreaId] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [sensors, setSensors] = useState<SensorRowState[]>([{ name: "", unit: "" }]);
    const [nameError, setNameError] = useState<string | null>(null);
    const [areaIdError, setAreaIdError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);

    useEffect(() => {
        if (open) {
            if (nodeType) {
                setName(nodeType.name);
                setAreaId(nodeType.area_id);
                setDescription(nodeType.description ?? "");
                if (nodeType.sensors.length > 0) {
                    setSensors(
                        nodeType.sensors.map((sensor) => ({
                            name: sensor.name,
                            unit: sensor.unit ?? "",
                        })),
                    );
                } else {
                    setSensors([{ name: "", unit: "" }]);
                }
            } else {
                setName("");
                setAreaId("");
                setDescription("");
                setSensors([{ name: "", unit: "" }]);
            }
            setNameError(null);
            setAreaIdError(null);
        }
    }, [open, nodeType]);

    const canAddSensor = useMemo(() => sensors.length < 8, [sensors.length]);

    const handleBlurAreaId = useCallback(() => {
        if (!AREA_ID_REGEX.test(areaId.trim())) {
            setAreaIdError(NODE_TYPE_STRINGS.AREA_ID_INVALID);
        } else {
            setAreaIdError(null);
        }
    }, [areaId]);

    const handleSensorChange = useCallback(
        (index: number, field: "name" | "unit", value: string) => {
            setSensors((prev) =>
                prev.map((row, i) =>
                    i === index
                        ? {
                              ...row,
                              [field]: value,
                          }
                        : row,
                ),
            );
        },
        [],
    );

    const handleAddSensor = useCallback(() => {
        if (!canAddSensor) return;
        setSensors((prev) => [...prev, { name: "", unit: "" }]);
    }, [canAddSensor]);

    const handleRemoveSensor = useCallback((index: number) => {
        setSensors((prev) => prev.slice(0, index));
    }, []);

    const buildSensorsPayload = useCallback((): SensorSlotPayload[] => {
        return sensors
            .map((row) => ({
                name: row.name.trim(),
                unit: row.unit.trim() === "" ? null : row.unit.trim(),
            }))
            .filter((row) => row.name !== "");
    }, [sensors]);

    const validate = useCallback((): boolean => {
        let valid = true;

        if (name.trim() === "") {
            setNameError(NODE_TYPE_STRINGS.NAME_REQUIRED);
            valid = false;
        } else {
            setNameError(null);
        }

        if (areaId.trim() === "") {
            setAreaIdError(NODE_TYPE_STRINGS.AREA_ID_REQUIRED);
            valid = false;
        } else if (!AREA_ID_REGEX.test(areaId.trim())) {
            setAreaIdError(NODE_TYPE_STRINGS.AREA_ID_INVALID);
            valid = false;
        } else {
            setAreaIdError(null);
        }

        return valid;
    }, [name, areaId]);

    const handleSubmit = useCallback(async () => {
        if (!validate()) return;

        setSubmitting(true);

        const sensorsPayload = buildSensorsPayload();

        const basePayload: StoreNodeTypePayload | UpdateNodeTypePayload = {
            name: name.trim(),
            area_id: areaId.trim(),
            description: description.trim() === "" ? null : description.trim(),
            sensors: sensorsPayload.length > 0 ? sensorsPayload : [],
        };

        try {
            if (isEditMode && nodeType) {
                await updateNodeType(nodeType.id, basePayload);
                toast.success(NODE_TYPE_STRINGS.SAVE_SUCCESS_UPDATE);
            } else {
                await createNodeType(basePayload as StoreNodeTypePayload);
                toast.success(NODE_TYPE_STRINGS.SAVE_SUCCESS_CREATE);
            }
            onSuccess();
            onOpenChange(false);
        } catch (errorUnknown) {
            const message =
                errorUnknown instanceof Error && errorUnknown.message
                    ? errorUnknown.message
                    : NODE_TYPE_STRINGS.SAVE_ERROR;
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    }, [
        validate,
        buildSensorsPayload,
        name,
        areaId,
        description,
        isEditMode,
        nodeType,
        onOpenChange,
        onSuccess,
    ]);

    const title = isEditMode
        ? NODE_TYPE_STRINGS.FORM_TITLE_EDIT
        : NODE_TYPE_STRINGS.FORM_TITLE_CREATE;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-card text-card-foreground border-border dark:bg-card dark:text-card-foreground dark:border-border">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="mt-4 grid gap-6">
                    <section className="grid gap-4">
                        <h2 className="text-sm font-semibold text-muted-foreground dark:text-muted-foreground">
                            {NODE_TYPE_STRINGS.TITLE}
                        </h2>
                        <div className="grid gap-2">
                            <Label htmlFor="node-type-name">{NODE_TYPE_STRINGS.LABEL_NAME}</Label>
                            <Input
                                id="node-type-name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                className="bg-background text-foreground dark:bg-background dark:text-foreground"
                            />
                            {nameError && (
                                <p className="text-xs text-destructive dark:text-destructive">
                                    {nameError}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="node-type-area-id">
                                {NODE_TYPE_STRINGS.LABEL_AREA_ID}
                            </Label>
                            <Input
                                id="node-type-area-id"
                                value={areaId}
                                onChange={(event) => setAreaId(event.target.value)}
                                onBlur={handleBlurAreaId}
                                placeholder={NODE_TYPE_STRINGS.AREA_ID_PLACEHOLDER}
                                className="bg-background text-foreground dark:bg-background dark:text-foreground font-mono"
                            />
                            {areaIdError && (
                                <p className="text-xs text-destructive dark:text-destructive">
                                    {areaIdError}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="node-type-description">
                                {NODE_TYPE_STRINGS.LABEL_DESCRIPTION}
                            </Label>
                            <Textarea
                                id="node-type-description"
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                className="min-h-[80px] bg-background text-foreground dark:bg-background dark:text-foreground"
                            />
                        </div>
                    </section>

                    <section className="grid gap-3">
                        <h2 className="text-sm font-semibold text-muted-foreground dark:text-muted-foreground">
                            {NODE_TYPE_STRINGS.SENSORS}
                        </h2>
                        <div className="grid gap-3">
                            {sensors.map((row, index) => {
                                const slot = index + 1;
                                const canRemove = sensors.length > 1;

                                return (
                                    <div
                                        key={slot}
                                        className="grid gap-2 rounded-md border border-border bg-background px-3 py-3 dark:bg-background"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-medium text-muted-foreground dark:text-muted-foreground">
                                                {NODE_TYPE_STRINGS.LABEL_SENSOR_NAME} #{slot}
                                            </span>
                                            {canRemove && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemoveSensor(index)
                                                                }
                                                                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs text-muted-foreground hover:bg-muted dark:text-muted-foreground dark:hover:bg-muted"
                                                                aria-label={UI_STRINGS.DELETE}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {
                                                                NODE_TYPE_STRINGS.REMOVE_SENSOR_TOOLTIP
                                                            }
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                        <div className="grid gap-2 md:grid-cols-2">
                                            <div className="grid gap-1">
                                                <Label className="text-xs">
                                                    {NODE_TYPE_STRINGS.LABEL_SENSOR_NAME}
                                                </Label>
                                                <Input
                                                    value={row.name}
                                                    onChange={(event) =>
                                                        handleSensorChange(
                                                            index,
                                                            "name",
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="bg-background text-foreground dark:bg-background dark:text-foreground"
                                                />
                                            </div>
                                            <div className="grid gap-1">
                                                <Label className="text-xs">
                                                    {NODE_TYPE_STRINGS.LABEL_SENSOR_UNIT}
                                                </Label>
                                                <Input
                                                    value={row.unit}
                                                    onChange={(event) =>
                                                        handleSensorChange(
                                                            index,
                                                            "unit",
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder={
                                                        NODE_TYPE_STRINGS.SENSOR_UNIT_PLACEHOLDER
                                                    }
                                                    className="bg-background text-foreground dark:bg-background dark:text-foreground"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!canAddSensor}
                                onClick={handleAddSensor}
                            >
                                {NODE_TYPE_STRINGS.ADD_SENSOR_BUTTON.replace(
                                    "{count}",
                                    String(sensors.length),
                                )}
                            </Button>
                        </div>
                    </section>

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            {UI_STRINGS.CANCEL}
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                void handleSubmit();
                            }}
                            disabled={submitting}
                        >
                            {UI_STRINGS.SAVE}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default NodeTypeFormDialog;

