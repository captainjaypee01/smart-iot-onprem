// src/pages/node-decommission/ManualDecommissionDialog.tsx
// Confirmation dialog for manually marking a node as decommissioned without sending an IoT command.

import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useManualDecommission } from '@/hooks/useNodeDecommission';
import { NODE_DECOMMISSION_STRINGS, UI_STRINGS } from '@/constants/strings';

export interface ManualDecommissionDialogProps {
  node: { id: number; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ManualDecommissionDialog = ({
  node,
  open,
  onOpenChange,
  onSuccess,
}: ManualDecommissionDialogProps) => {
  const { manual, isSubmitting } = useManualDecommission();

  const handleConfirm = async () => {
    if (!node) return;
    try {
      await manual(node.id);
      toast.success(NODE_DECOMMISSION_STRINGS.SUCCESS_MANUAL);
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(NODE_DECOMMISSION_STRINGS.ERROR_MANUAL);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{NODE_DECOMMISSION_STRINGS.MANUAL_CONFIRM_TITLE}</AlertDialogTitle>
          <AlertDialogDescription>
            {node
              ? NODE_DECOMMISSION_STRINGS.MANUAL_CONFIRM_BODY(node.name)
              : NODE_DECOMMISSION_STRINGS.MANUAL_CONFIRM_TITLE}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>{UI_STRINGS.CANCEL}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void handleConfirm()}
            disabled={isSubmitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting
              ? NODE_DECOMMISSION_STRINGS.MANUAL_CONFIRM_SUBMITTING
              : NODE_DECOMMISSION_STRINGS.MANUAL_CONFIRM_SUBMIT}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ManualDecommissionDialog;
