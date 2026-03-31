// src/pages/provisioning/NewProvisioningPage.tsx
// Superadmin-only form to create a new provisioning batch (up to 10 nodes).

import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNetworkOptions } from "@/hooks/useNetworks";
import { useCreateProvisioningBatch } from "@/hooks/useProvisioning";
import { PROVISIONING_STRINGS } from "@/constants/strings";

const MAX_NODES = 10;

interface NodeRow {
    serviceId: string;
    nodeAddress: string;
    serviceIdError: string;
    nodeAddressError: string;
}

const emptyRow = (): NodeRow => ({
    serviceId: "",
    nodeAddress: "",
    serviceIdError: "",
    nodeAddressError: "",
});

const NewProvisioningPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const networkIdParam = searchParams.get("network_id");
    const networkId = networkIdParam !== null ? Number(networkIdParam) : null;

    const { options: networkOptions } = useNetworkOptions();
    const { create, isSubmitting } = useCreateProvisioningBatch();

    const networkName = networkId !== null
        ? (networkOptions.find((o) => o.id === networkId)?.name ?? PROVISIONING_STRINGS.NETWORK_NOT_FOUND)
        : PROVISIONING_STRINGS.NETWORK_NOT_FOUND;

    const [targetNodeId, setTargetNodeId] = useState<string>("");
    const [targetNodeIdError, setTargetNodeIdError] = useState<string>("");
    const [isAutoRegister, setIsAutoRegister] = useState<boolean>(false);
    const [nodes, setNodes] = useState<NodeRow[]>([emptyRow()]);

    const updateNode = (index: number, field: keyof NodeRow, value: string) => {
        setNodes((prev) =>
            prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
        );
    };

    const handleNodeAddressBlur = (index: number) => {
        setNodes((prev) =>
            prev.map((row, i) =>
                i === index
                    ? { ...row, nodeAddress: row.nodeAddress.toUpperCase() }
                    : row,
            ),
        );
    };

    const handleTargetNodeIdBlur = () => {
        setTargetNodeId((prev) => prev.toUpperCase());
    };

    const addNode = () => {
        if (nodes.length < MAX_NODES) {
            setNodes((prev) => [...prev, emptyRow()]);
        }
    };

    const removeNode = (index: number) => {
        if (nodes.length <= 1) return;
        setNodes((prev) => prev.filter((_, i) => i !== index));
    };

    const validate = (): boolean => {
        let valid = true;

        // Validate target node ID
        let targetError = "";
        if (targetNodeId.trim() === "") {
            targetError = PROVISIONING_STRINGS.ERROR_TARGET_NODE_ID_REQUIRED;
            valid = false;
        } else if (targetNodeId.length > 10) {
            targetError = PROVISIONING_STRINGS.ERROR_TARGET_NODE_ID_MAX;
            valid = false;
        }
        setTargetNodeIdError(targetError);

        // Collect service IDs to detect duplicates
        const serviceIds = nodes.map((n) => n.serviceId.trim());

        const updatedNodes = nodes.map((row, index) => {
            let serviceIdError = "";
            let nodeAddressError = "";

            if (row.serviceId.trim() === "") {
                serviceIdError = PROVISIONING_STRINGS.ERROR_SERVICE_ID_REQUIRED;
                valid = false;
            } else {
                const isDuplicate =
                    serviceIds.indexOf(row.serviceId.trim()) !== index;
                if (isDuplicate) {
                    serviceIdError = PROVISIONING_STRINGS.ERROR_DUPLICATE_SERVICE_ID;
                    valid = false;
                }
            }

            if (row.nodeAddress.trim() === "") {
                nodeAddressError = PROVISIONING_STRINGS.ERROR_NODE_ADDRESS_REQUIRED;
                valid = false;
            } else if (row.nodeAddress.trim().length > 10) {
                nodeAddressError = PROVISIONING_STRINGS.ERROR_NODE_ADDRESS_MAX;
                valid = false;
            }

            return { ...row, serviceIdError, nodeAddressError };
        });

        setNodes(updatedNodes);
        return valid;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        if (networkId === null) return;

        try {
            const response = await create({
                network_id: networkId,
                target_node_id: targetNodeId,
                is_auto_register: isAutoRegister,
                nodes: nodes.map((row) => ({
                    service_id: row.serviceId.trim(),
                    node_address: row.nodeAddress.trim().toUpperCase(),
                })),
            });
            toast.success(PROVISIONING_STRINGS.SUCCESS_SUBMIT);
            navigate(`/provisioning/${response.data.primary.id}`);
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : PROVISIONING_STRINGS.ERROR_SUBMIT;
            toast.error(message);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/provisioning" aria-label={PROVISIONING_STRINGS.BACK}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    {PROVISIONING_STRINGS.NEW_TITLE}
                </h1>
            </div>

            {/* Network (read-only) */}
            <div className="flex flex-col gap-2">
                <Label>{PROVISIONING_STRINGS.LABEL_NETWORK}</Label>
                <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {networkName}
                </div>
            </div>

            {/* Target Node ID */}
            <div className="flex flex-col gap-2">
                <Label htmlFor="target-node-id">
                    {PROVISIONING_STRINGS.LABEL_TARGET_NODE_ID}
                </Label>
                <Input
                    id="target-node-id"
                    value={targetNodeId}
                    maxLength={10}
                    onChange={(e) => setTargetNodeId(e.target.value)}
                    onBlur={handleTargetNodeIdBlur}
                    placeholder="FFFFFFFF"
                    className={targetNodeIdError !== "" ? "border-destructive" : ""}
                />
                {targetNodeIdError !== "" && (
                    <p className="text-sm text-destructive">{targetNodeIdError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                    {PROVISIONING_STRINGS.TARGET_NODE_ID_HELPER}
                </p>
            </div>

            {/* Is Auto Register */}
            <div className="flex items-center gap-3">
                <Switch
                    id="is-auto-register"
                    checked={isAutoRegister}
                    onCheckedChange={setIsAutoRegister}
                />
                <Label htmlFor="is-auto-register">
                    {PROVISIONING_STRINGS.LABEL_IS_AUTO_REGISTER}
                </Label>
            </div>

            {/* Node list */}
            <div className="flex flex-col gap-4">
                <p className="text-sm font-medium text-foreground">
                    {PROVISIONING_STRINGS.NODE_SECTION_TITLE}
                </p>

                {nodes.map((row, index) => (
                    <div key={index} className="flex items-start gap-3">
                        {/* Row number */}
                        <span className="mt-2.5 w-5 flex-shrink-0 text-right text-sm text-muted-foreground">
                            {PROVISIONING_STRINGS.ROW_NUMBER(index + 1)}
                        </span>

                        {/* Service ID */}
                        <div className="flex flex-1 flex-col gap-1">
                            <Label className="sr-only" htmlFor={`service-id-${index}`}>
                                {PROVISIONING_STRINGS.LABEL_SERVICE_ID}
                            </Label>
                            <Input
                                id={`service-id-${index}`}
                                placeholder={PROVISIONING_STRINGS.LABEL_SERVICE_ID}
                                value={row.serviceId}
                                maxLength={255}
                                onChange={(e) => updateNode(index, "serviceId", e.target.value)}
                                className={row.serviceIdError !== "" ? "border-destructive" : ""}
                            />
                            {row.serviceIdError !== "" && (
                                <p className="text-xs text-destructive">{row.serviceIdError}</p>
                            )}
                        </div>

                        {/* Node Address */}
                        <div className="flex flex-1 flex-col gap-1">
                            <Label className="sr-only" htmlFor={`node-address-${index}`}>
                                {PROVISIONING_STRINGS.LABEL_NODE_ADDRESS}
                            </Label>
                            <Input
                                id={`node-address-${index}`}
                                placeholder={PROVISIONING_STRINGS.LABEL_NODE_ADDRESS}
                                value={row.nodeAddress}
                                maxLength={10}
                                onChange={(e) => updateNode(index, "nodeAddress", e.target.value)}
                                onBlur={() => handleNodeAddressBlur(index)}
                                className={row.nodeAddressError !== "" ? "border-destructive" : ""}
                            />
                            {row.nodeAddressError !== "" && (
                                <p className="text-xs text-destructive">{row.nodeAddressError}</p>
                            )}
                        </div>

                        {/* Remove button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="mt-1 flex-shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeNode(index)}
                            disabled={nodes.length <= 1}
                            aria-label={PROVISIONING_STRINGS.REMOVE_NODE}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}

                <Button
                    variant="outline"
                    onClick={addNode}
                    disabled={nodes.length >= MAX_NODES}
                    className="self-start"
                >
                    {PROVISIONING_STRINGS.ADD_NODE_COUNT(nodes.length)}
                </Button>
            </div>

            {/* Submit */}
            <div>
                <Button
                    onClick={() => void handleSubmit()}
                    disabled={isSubmitting || networkId === null}
                    className="gap-2"
                >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSubmitting
                        ? PROVISIONING_STRINGS.SUBMITTING
                        : PROVISIONING_STRINGS.SUBMIT}
                </Button>
            </div>
        </div>
    );
};

export default NewProvisioningPage;
