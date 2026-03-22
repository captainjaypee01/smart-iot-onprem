// src/pages/features/FeaturesPage.tsx
// Superadmin-only feature registry: reorder groups (tabs), reorder features per group, inline active toggle, edit dialog.

import {
    createElement,
    useCallback,
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
} from "react";
import { Navigate } from "react-router-dom";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    horizontalListSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import FeatureEditDialog from "@/components/shared/FeatureEditDialog";
import FeatureCreateDialog from "@/components/shared/FeatureCreateDialog";
import { FEATURE_MODULE_STRINGS, UI_STRINGS } from "@/constants/strings";
import {
    useFeatureAdmin,
    useReorderFeatureGroups,
    useReorderFeatures,
    useDeleteFeature,
    useUpdateFeature,
} from "@/hooks/useFeatureAdmin";
import { useRole } from "@/hooks/useRole";
import { getFeatureLucideIcon } from "@/lib/featureLucideIcon";
import { cn } from "@/lib/utils";
import type { Feature, FeatureGroup } from "@/types/feature";

function groupOrderValue(g: FeatureGroup): number {
    const f = g.features[0];
    return f?.group_order ?? 0;
}

function sortFeaturesInGroup(features: Feature[]): Feature[] {
    return [...features].sort((a, b) => a.sort_order - b.sort_order);
}

function sortFeatureGroups(groups: FeatureGroup[]): FeatureGroup[] {
    const normalized = groups.map((g) => ({
        ...g,
        features: sortFeaturesInGroup(g.features),
    }));
    const admin = normalized.filter((g) => g.group === "admin");
    const rest = normalized.filter((g) => g.group !== "admin");
    rest.sort((a, b) => groupOrderValue(a) - groupOrderValue(b));
    return [...rest, ...admin];
}

function replaceGroupFeatures(
    groups: FeatureGroup[],
    groupKey: string,
    nextFeatures: Feature[],
): FeatureGroup[] {
    return groups.map((g) => (g.group === groupKey ? { ...g, features: nextFeatures } : g));
}

interface SortableGroupTabProps {
    groupKey: string;
    label: string;
    disabled: boolean;
}

function SortableGroupTab({ groupKey, label, disabled }: SortableGroupTabProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: groupKey,
        disabled,
    });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.88 : 1,
        zIndex: isDragging ? 2 : undefined,
    };

    return (
        <TabsTrigger
            ref={setNodeRef}
            style={style}
            value={groupKey}
            disabled={disabled}
            aria-label={FEATURE_MODULE_STRINGS.DRAG_GROUP_TAB_ARIA}
            className={cn(
                "cursor-grab touch-none active:cursor-grabbing",
                "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                "dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground",
            )}
            {...attributes}
            {...listeners}
        >
            {label}
        </TabsTrigger>
    );
}

interface SortableFeatureRowProps {
    feature: Feature;
    groupIsAdmin: boolean;
    onEdit: (f: Feature) => void;
    onToggleActive: (f: Feature) => void;
    onDelete: (f: Feature) => void;
    togglingId: number | null;
    deletingId: number | null;
    disabled: boolean;
}

function SortableFeatureRow({
    feature,
    groupIsAdmin,
    onEdit,
    onToggleActive,
    onDelete,
    togglingId,
    deletingId,
    disabled,
}: SortableFeatureRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: feature.id, disabled });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.92 : 1,
        zIndex: isDragging ? 1 : undefined,
    };

    const isRowBusy = togglingId === feature.id;
    const isDeletingRow = deletingId === feature.id;

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={cn(
                "border-b border-border bg-card dark:border-border dark:bg-card",
                isDragging && "shadow-sm",
            )}
            {...attributes}
        >
            <td className="w-10 px-2 py-2 align-middle">
                <button
                    type="button"
                    ref={setActivatorNodeRef}
                    className={cn(
                        "text-muted-foreground hover:text-foreground inline-flex rounded-md p-1",
                        "dark:text-muted-foreground dark:hover:text-foreground",
                        disabled && "pointer-events-none opacity-40",
                    )}
                    aria-label={FEATURE_MODULE_STRINGS.DRAG_ROW_ARIA}
                    {...listeners}
                >
                    <GripVertical className="h-4 w-4 shrink-0" />
                </button>
            </td>
            <td className="px-2 py-2 align-middle">
                {createElement(getFeatureLucideIcon(feature.icon), {
                    className: "h-5 w-5 shrink-0 text-foreground dark:text-foreground",
                })}
            </td>
            <td className="px-2 py-2 align-middle text-sm font-medium text-foreground dark:text-foreground">
                <span className="inline-flex flex-wrap items-center gap-2">
                    {feature.name}
                    {groupIsAdmin ? (
                        <span className="text-muted-foreground rounded border border-border px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide dark:border-border dark:text-muted-foreground">
                            {FEATURE_MODULE_STRINGS.SUPERADMIN_ONLY}
                        </span>
                    ) : null}
                </span>
            </td>
            <td className="px-2 py-2 align-middle">
                <code className="font-mono text-xs text-foreground dark:text-foreground">
                    {feature.key}
                </code>
            </td>
            <td className="px-2 py-2 align-middle">
                <code className="text-muted-foreground font-mono text-xs dark:text-muted-foreground">
                    {feature.route}
                </code>
            </td>
            <td className="px-2 py-2 align-middle">
                <Switch
                    checked={feature.is_active}
                    disabled={isRowBusy || disabled}
                    onCheckedChange={() => onToggleActive(feature)}
                />
            </td>
            <td className="px-2 py-2 align-middle">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="dark:border-border"
                    onClick={() => onEdit(feature)}
                >
                    {FEATURE_MODULE_STRINGS.EDIT}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-2 dark:border-border"
                    onClick={() => onDelete(feature)}
                    aria-label={UI_STRINGS.DELETE}
                    disabled={disabled || isRowBusy || isDeletingRow}
                >
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </td>
        </tr>
    );
}

const FeaturesPage = () => {
    const { isSuperAdmin } = useRole();
    const { groups, isLoading, refetch } = useFeatureAdmin();
    const { mutate: reorderGroupsMutate, isReordering: isReorderingGroups } =
        useReorderFeatureGroups();
    const { mutate: reorderFeaturesMutate, isReordering: isReorderingFeatures } =
        useReorderFeatures();
    const { mutate: patchFeature } = useUpdateFeature();
    const { deleteFeature, isDeleting } = useDeleteFeature();

    const [localGroups, setLocalGroups] = useState<FeatureGroup[]>([]);
    const [activeTab, setActiveTab] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Feature | undefined>(undefined);
    const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Feature | null>(null);

    const deletingId = isDeleting && deleteTarget ? deleteTarget.id : null;

    useEffect(() => {
        setLocalGroups(sortFeatureGroups(groups));
    }, [groups]);

    const sorted = useMemo(() => sortFeatureGroups(localGroups), [localGroups]);
    const draggableGroups = useMemo(() => sorted.filter((g) => g.group !== "admin"), [sorted]);
    const adminGroup = useMemo(() => sorted.find((g) => g.group === "admin"), [sorted]);
    const draggableIds = useMemo(() => draggableGroups.map((g) => g.group), [draggableGroups]);

    useEffect(() => {
        if (sorted.length === 0) return;
        if (!activeTab || !sorted.some((g) => g.group === activeTab)) {
            setActiveTab(sorted[0]!.group);
        }
    }, [sorted, activeTab]);

    const groupSensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const rowSensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleGroupDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const ids = draggableIds;
        const oldIndex = ids.indexOf(String(active.id));
        const newIndex = ids.indexOf(String(over.id));
        if (oldIndex < 0 || newIndex < 0) return;

        const reorderedDraggable = arrayMove(draggableGroups, oldIndex, newIndex);
        const snapshot = localGroups;

        const withOrders = reorderedDraggable.map((g, i) => ({
            ...g,
            features: g.features.map((f) => ({ ...f, group_order: i + 1 })),
        }));
        const nextLocal = adminGroup ? [...withOrders, adminGroup] : withOrders;
        setLocalGroups(nextLocal);

        try {
            await reorderGroupsMutate({
                groups: reorderedDraggable.map((g, i) => ({
                    group: g.group,
                    group_order: i + 1,
                })),
            });
            await refetch();
        } catch {
            setLocalGroups(snapshot);
            toast.error(FEATURE_MODULE_STRINGS.ERROR_REORDER_GROUPS);
        }
    };

    const handleFeatureDragEnd = useCallback(
        async (groupKey: string, event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            const group = localGroups.find((g) => g.group === groupKey);
            if (!group) return;

            const ordered = sortFeaturesInGroup(group.features);
            const ids = ordered.map((f) => f.id);
            const oldIndex = ids.indexOf(Number(active.id));
            const newIndex = ids.indexOf(Number(over.id));
            if (oldIndex < 0 || newIndex < 0) return;

            const reordered = arrayMove(ordered, oldIndex, newIndex);
            const nextFeatures = reordered.map((f, i) => ({ ...f, sort_order: i }));
            const snapshot = localGroups;
            setLocalGroups(replaceGroupFeatures(localGroups, groupKey, nextFeatures));

            try {
                await reorderFeaturesMutate({
                    features: nextFeatures.map((f) => ({ id: f.id, sort_order: f.sort_order })),
                });
                await refetch();
            } catch {
                setLocalGroups(snapshot);
                toast.error(FEATURE_MODULE_STRINGS.ERROR_REORDER_FEATURES);
            }
        },
        [localGroups, refetch, reorderFeaturesMutate],
    );

    const handleToggleActive = async (f: Feature) => {
        const groupKey = f.group;
        const current = localGroups.find((g) => g.group === groupKey);
        if (!current) return;

        setTogglingId(f.id);
        const snapshot = localGroups;
        setLocalGroups(
            replaceGroupFeatures(
                localGroups,
                groupKey,
                sortFeaturesInGroup(
                    current.features.map((x) =>
                        x.id === f.id ? { ...x, is_active: !x.is_active } : x,
                    ),
                ),
            ),
        );
        try {
            await patchFeature(f.id, { is_active: !f.is_active });
            await refetch();
        } catch {
            setLocalGroups(snapshot);
            toast.error(FEATURE_MODULE_STRINGS.ERROR_TOGGLE_ACTIVE);
        } finally {
            setTogglingId(null);
        }
    };

    const openEdit = (f: Feature) => {
        setEditTarget(f);
        setDialogOpen(true);
    };

    const handleConfirmDelete = async (): Promise<void> => {
        if (!deleteTarget) return;

        try {
            await deleteFeature(deleteTarget.id);
            toast.success(FEATURE_MODULE_STRINGS.SUCCESS_DELETE);
            setDeleteTarget(null);
            await refetch();
        } catch {
            toast.error(FEATURE_MODULE_STRINGS.ERROR_DELETE);
        }
    };

    if (!isSuperAdmin()) {
        return <Navigate to="/" replace />;
    }

    if (isLoading && localGroups.length === 0) {
        return (
            <div className="text-muted-foreground flex items-center gap-2 dark:text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                {UI_STRINGS.LOADING}
            </div>
        );
    }

    const rowDndDisabled = isReorderingFeatures || isReorderingGroups;

    return (
        <div className="flex flex-col gap-6">
            <div>
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground dark:text-foreground">
                            {FEATURE_MODULE_STRINGS.PAGE_TITLE}
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm dark:text-muted-foreground">
                            {FEATURE_MODULE_STRINGS.PAGE_SUBTITLE}
                        </p>
                    </div>
                    <Button
                        type="button"
                        className="gap-2"
                        onClick={() => setCreateDialogOpen(true)}
                        disabled={isLoading || isReorderingGroups || isReorderingFeatures || isDeleting}
                    >
                        <Plus className="h-4 w-4" />
                        {FEATURE_MODULE_STRINGS.CREATE_FEATURE}
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <DndContext
                    sensors={groupSensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleGroupDragEnd}
                >
                    <SortableContext items={draggableIds} strategy={horizontalListSortingStrategy}>
                        <TabsList
                            className={cn(
                                "inline-flex h-auto w-full flex-wrap items-stretch gap-1 rounded-lg p-1",
                                "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground",
                            )}
                        >
                            {draggableGroups.map((g) => (
                                <SortableGroupTab
                                    key={g.group}
                                    groupKey={g.group}
                                    label={g.label}
                                    disabled={isReorderingGroups}
                                />
                            ))}
                            {adminGroup ? (
                                <TabsTrigger
                                    value={adminGroup.group}
                                    className={cn(
                                        "cursor-default data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                                        "dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground",
                                    )}
                                >
                                    {adminGroup.label}
                                </TabsTrigger>
                            ) : null}
                        </TabsList>
                    </SortableContext>
                </DndContext>

                {sorted.map((g) => (
                    <TabsContent key={g.group} value={g.group} className="mt-4 outline-none">
                        <DndContext
                            sensors={rowSensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(e) => void handleFeatureDragEnd(g.group, e)}
                        >
                            <SortableContext
                                items={g.features.map((f) => f.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="overflow-x-auto rounded-lg border border-border dark:border-border">
                                    <table className="w-full min-w-[720px] text-left text-sm">
                                        <thead className="bg-muted/50 dark:bg-muted/50">
                                            <tr className="border-b border-border dark:border-border">
                                                <th
                                                    className="text-muted-foreground w-10 px-2 py-2 text-xs font-semibold uppercase tracking-wide dark:text-muted-foreground"
                                                    scope="col"
                                                    aria-hidden
                                                />
                                                <th
                                                    className="text-muted-foreground px-2 py-2 text-xs font-semibold uppercase tracking-wide dark:text-muted-foreground"
                                                    scope="col"
                                                >
                                                    {FEATURE_MODULE_STRINGS.COL_ICON}
                                                </th>
                                                <th
                                                    className="text-muted-foreground px-2 py-2 text-xs font-semibold uppercase tracking-wide dark:text-muted-foreground"
                                                    scope="col"
                                                >
                                                    {FEATURE_MODULE_STRINGS.COL_NAME}
                                                </th>
                                                <th
                                                    className="text-muted-foreground px-2 py-2 text-xs font-semibold uppercase tracking-wide dark:text-muted-foreground"
                                                    scope="col"
                                                >
                                                    {FEATURE_MODULE_STRINGS.COL_KEY}
                                                </th>
                                                <th
                                                    className="text-muted-foreground px-2 py-2 text-xs font-semibold uppercase tracking-wide dark:text-muted-foreground"
                                                    scope="col"
                                                >
                                                    {FEATURE_MODULE_STRINGS.COL_ROUTE}
                                                </th>
                                                <th
                                                    className="text-muted-foreground px-2 py-2 text-xs font-semibold uppercase tracking-wide dark:text-muted-foreground"
                                                    scope="col"
                                                >
                                                    {FEATURE_MODULE_STRINGS.COL_ACTIVE}
                                                </th>
                                                <th
                                                    className="text-muted-foreground px-2 py-2 text-xs font-semibold uppercase tracking-wide dark:text-muted-foreground"
                                                    scope="col"
                                                >
                                                    {FEATURE_MODULE_STRINGS.COL_ACTIONS}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {g.features.map((f) => (
                                                <SortableFeatureRow
                                                    key={f.id}
                                                    feature={f}
                                                    groupIsAdmin={g.group === "admin"}
                                                    onEdit={openEdit}
                                                    onToggleActive={(feat) => void handleToggleActive(feat)}
                                                    onDelete={(feat) => setDeleteTarget(feat)}
                                                    togglingId={togglingId}
                                                    deletingId={deletingId}
                                                    disabled={rowDndDisabled}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </SortableContext>
                        </DndContext>
                    </TabsContent>
                ))}
            </Tabs>

            <FeatureEditDialog
                key={`${editTarget?.id ?? "none"}-${dialogOpen}`}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                feature={editTarget}
                onSuccess={() => void refetch()}
            />

            <FeatureCreateDialog
                key={createDialogOpen ? "feature-create-open" : "feature-create-closed"}
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                groups={sorted.filter((g) => g.group !== "admin")}
                onSuccess={() => void refetch()}
            />

            <AlertDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{FEATURE_MODULE_STRINGS.CONFIRM_DELETE_TITLE}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {FEATURE_MODULE_STRINGS.CONFIRM_DELETE_DESCRIPTION}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            {UI_STRINGS.CANCEL}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => void handleConfirmDelete()}
                            disabled={isDeleting}
                        >
                            {UI_STRINGS.DELETE}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default FeaturesPage;
