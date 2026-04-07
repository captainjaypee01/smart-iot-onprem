// src/pages/gateways/DeleteGatewayDialog.tsx
// Confirmation dialog before deleting a gateway.

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import type { Gateway } from '@/types/gateway';
import { GATEWAY_STRINGS, UI_STRINGS } from '@/constants/strings';

export interface DeleteGatewayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gateway: Gateway | null;
  isDeleting: boolean;
  onConfirm: () => void;
}

const DeleteGatewayDialog = ({
  open,
  onOpenChange,
  gateway,
  isDeleting,
  onConfirm,
}: DeleteGatewayDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{GATEWAY_STRINGS.CONFIRM_DELETE_TITLE}</AlertDialogTitle>
          <AlertDialogDescription>
            {gateway
              ? GATEWAY_STRINGS.CONFIRM_DELETE_DESCRIPTION(gateway.gateway_id, gateway.name)
              : GATEWAY_STRINGS.CONFIRM_DELETE_TITLE}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{UI_STRINGS.CANCEL}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {UI_STRINGS.DELETE}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteGatewayDialog;
