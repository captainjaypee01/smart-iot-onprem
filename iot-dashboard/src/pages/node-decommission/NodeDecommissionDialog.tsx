// src/pages/node-decommission/NodeDecommissionDialog.tsx
// Confirmation dialog for sending the decommission command to a node.
// The payload (0e05446f697421) is hardcoded server-side — no user input required.

import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDecommissionNode } from '@/hooks/useNodeDecommission';
import type { DecommissionNode } from '@/types/nodeDecommission';
import { NODE_DECOMMISSION_STRINGS, UI_STRINGS } from '@/constants/strings';

export interface NodeDecommissionDialogProps {
  node: DecommissionNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const NodeDecommissionDialog = ({
  node,
  open,
  onOpenChange,
  onSuccess,
}: NodeDecommissionDialogProps) => {
  const { decommission, isSubmitting } = useDecommissionNode();

  const handleClose = () => {
    if (isSubmitting) return;
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!node) return;
    try {
      await decommission(node.id, { network_id: node.network.id });
      toast.success(NODE_DECOMMISSION_STRINGS.SUCCESS_DECOMMISSION);
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(NODE_DECOMMISSION_STRINGS.ERROR_DECOMMISSION);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle>{NODE_DECOMMISSION_STRINGS.DECOMMISSION_DIALOG_TITLE}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 pb-2 space-y-4">
          {/* Node info */}
          {node && (
            <div className="rounded-md border border-border bg-muted/40 p-4 space-y-1 text-sm">
              <div className="flex gap-2">
                <span className="text-muted-foreground w-28 shrink-0">Node Name</span>
                <span className="font-medium">{node.name}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-28 shrink-0">Address</span>
                <span className="font-mono">{node.node_address}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-28 shrink-0">Service ID</span>
                <span className="font-mono">{node.service_id}</span>
              </div>
            </div>
          )}

          {/* Command preview (read-only) */}
          <div className="rounded-md border border-border bg-muted/40 p-4 space-y-2 text-sm">
            <p className="font-medium text-muted-foreground">
              {NODE_DECOMMISSION_STRINGS.COMMAND_PREVIEW_LABEL}
            </p>
            <div className="flex gap-2 items-center">
              <span className="text-muted-foreground w-28 shrink-0">Command</span>
              <code className="font-mono text-xs bg-background border border-border rounded px-2 py-1">
                {'<packet_id>'} + 0e05446f697421
              </code>
            </div>
            <p className="text-xs text-muted-foreground">
              {NODE_DECOMMISSION_STRINGS.COMMAND_PREVIEW_HINT}
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            {NODE_DECOMMISSION_STRINGS.DECOMMISSION_DIALOG_BODY}
          </p>
        </div>

        <DialogFooter className="px-6 py-4 shrink-0 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            {UI_STRINGS.CANCEL}
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting
              ? NODE_DECOMMISSION_STRINGS.DECOMMISSION_SUBMITTING_LABEL
              : NODE_DECOMMISSION_STRINGS.DECOMMISSION_SUBMIT_LABEL}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NodeDecommissionDialog;
