// src/pages/gateways/SendGatewayCommandDialog.tsx
// Smart multi-step dialog for sending a command to a gateway.
// Step flow: select → configure (only for service_restart) → confirm → send.

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, ChevronRight, Loader2, RotateCcw, Stethoscope, Upload } from 'lucide-react';
import { useSendGatewayCommand } from '@/hooks/useGateways';
import type { Gateway, GatewayCommandType } from '@/types/gateway';
import { DIAGNOSTIC_TYPES, SERVICE_NAMES } from '@/types/gateway';
import { GATEWAY_STRINGS, UI_STRINGS } from '@/constants/strings';

// ─── Types ────────────────────────────────────────────────────────

type Step = 'select' | 'configure' | 'confirm';

interface SelectedCommand {
  type: GatewayCommandType;
  diagnostic_type?: string;
  service_name?: string;
  /** Human-readable summary shown in confirm step. */
  label: string;
}

// ─── Advanced command list ─────────────────────────────────────────

const ADVANCED_COMMANDS: { value: GatewayCommandType; label: string }[] = [
  { value: 'get_configs', label: 'Get Configs' },
  { value: 'otap_load_scratchpad', label: 'OTAP Load Scratchpad' },
  { value: 'otap_process_scratchpad', label: 'OTAP Process Scratchpad' },
  { value: 'otap_set_target_scratchpad', label: 'OTAP Set Target Scratchpad' },
  { value: 'otap_status', label: 'OTAP Status' },
  { value: 'upload_software_update', label: 'Upload Software Update' },
  { value: 'sync_gateway_time', label: 'Sync Gateway Time' },
  { value: 'renew_certificate', label: 'Renew Certificate' },
];

// ─── Props ────────────────────────────────────────────────────────

export interface SendGatewayCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gateway: Gateway | null;
  onSuccess?: () => void;
}

// ─── Component ────────────────────────────────────────────────────

const SendGatewayCommandDialog = ({
  open,
  onOpenChange,
  gateway,
  onSuccess,
}: SendGatewayCommandDialogProps) => {
  const [step, setStep] = useState<Step>('select');
  const [selected, setSelected] = useState<SelectedCommand | null>(null);

  // Configure step state (only used for service_restart diagnostic)
  const [serviceName, setServiceName] = useState<string>('');
  const [serviceNameError, setServiceNameError] = useState<string>('');

  // Advanced section state
  const [advancedType, setAdvancedType] = useState<string>('');
  const [advancedTypeError, setAdvancedTypeError] = useState<string>('');

  // Diagnostic sub-type (for "Get Diagnostic" quick action)
  const [diagnosticType, setDiagnosticType] = useState<string>('');
  const [diagnosticTypeError, setDiagnosticTypeError] = useState<string>('');

  // Which quick-action section is expanded: 'quick' | 'advanced' | null
  const [activeSection, setActiveSection] = useState<'quick' | 'advanced' | null>(null);

  const { send, isSubmitting } = useSendGatewayCommand();

  // Reset all state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep('select');
      setSelected(null);
      setServiceName('');
      setServiceNameError('');
      setAdvancedType('');
      setAdvancedTypeError('');
      setDiagnosticType('');
      setDiagnosticTypeError('');
      setActiveSection(null);
    }
  }, [open]);

  // ── Quick-action handlers ────────────────────────────────────────

  const handleRestartGateway = useCallback(() => {
    setSelected({
      type: 'restart_gateway',
      label: GATEWAY_STRINGS.BUTTON_RESTART_GATEWAY,
    });
    setStep('confirm');
  }, []);

  const handleUploadLogs = useCallback(() => {
    setSelected({
      type: 'diagnostic',
      diagnostic_type: 'upload_file',
      label: GATEWAY_STRINGS.BUTTON_UPLOAD_LOGS,
    });
    setStep('confirm');
  }, []);

  const handleGetDiagnostic = useCallback(() => {
    if (!diagnosticType) {
      setDiagnosticTypeError(GATEWAY_STRINGS.ERROR_COMMAND_TYPE_REQUIRED);
      return;
    }
    setDiagnosticTypeError('');

    if (diagnosticType === 'service_restart') {
      // Needs service_name — go to configure step
      setSelected({
        type: 'diagnostic',
        diagnostic_type: 'service_restart',
        label: GATEWAY_STRINGS.BUTTON_GET_DIAGNOSTIC,
      });
      setStep('configure');
    } else {
      const label =
        DIAGNOSTIC_TYPES.find((d) => d.value === diagnosticType)?.label ?? diagnosticType;
      setSelected({
        type: 'diagnostic',
        diagnostic_type: diagnosticType,
        label: `${GATEWAY_STRINGS.BUTTON_GET_DIAGNOSTIC}: ${label}`,
      });
      setStep('confirm');
    }
  }, [diagnosticType]);

  const handleAdvancedProceed = useCallback(() => {
    if (!advancedType) {
      setAdvancedTypeError(GATEWAY_STRINGS.ERROR_COMMAND_TYPE_REQUIRED);
      return;
    }
    setAdvancedTypeError('');
    const label =
      ADVANCED_COMMANDS.find((c) => c.value === advancedType)?.label ?? advancedType;
    setSelected({ type: advancedType as GatewayCommandType, label });
    setStep('confirm');
  }, [advancedType]);

  // ── Configure step submit (only service_restart reaches here) ────

  const handleConfigureSubmit = useCallback(() => {
    if (!serviceName) {
      setServiceNameError(GATEWAY_STRINGS.ERROR_COMMAND_TYPE_REQUIRED);
      return;
    }
    setServiceNameError('');
    const svcLabel =
      SERVICE_NAMES.find((s) => s.value === serviceName)?.label ?? serviceName;
    setSelected((prev) =>
      prev
        ? { ...prev, service_name: serviceName, label: `Restart Service: ${svcLabel}` }
        : prev,
    );
    setStep('confirm');
  }, [serviceName]);

  // ── Final send ───────────────────────────────────────────────────

  const handleConfirm = useCallback(async () => {
    if (!gateway || !selected) return;
    try {
      await send(gateway.id, {
        type: selected.type,
        diagnostic_type: selected.diagnostic_type ?? null,
        service_name: selected.service_name ?? null,
      });
      const successMsg =
        selected.type === 'restart_gateway'
          ? GATEWAY_STRINGS.SUCCESS_RESTART_GATEWAY
          : GATEWAY_STRINGS.SUCCESS_SEND_DIAGNOSTIC;
      toast.success(successMsg);
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : GATEWAY_STRINGS.ERROR_SEND_COMMAND;
      toast.error(message);
    }
  }, [gateway, selected, send, onSuccess, onOpenChange]);

  // ── Step titles ──────────────────────────────────────────────────

  const stepTitle: Record<Step, string> = {
    select: GATEWAY_STRINGS.SEND_COMMAND_TITLE,
    configure: GATEWAY_STRINGS.SEND_COMMAND_TITLE,
    confirm: GATEWAY_STRINGS.CONFIRM_COMMAND_TITLE,
  };

  // ── Render ───────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{stepTitle[step]}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-1 space-y-5">

          {/* ── SELECT step ───────────────────────────────────────── */}
          {step === 'select' && (
            <>
              {/* Gateway Actions */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Gateway Actions
                </p>

                {/* Restart Gateway */}
                <div className="rounded-md border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {GATEWAY_STRINGS.BUTTON_RESTART_GATEWAY}
                      </span>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleRestartGateway}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {GATEWAY_STRINGS.CONFIRM_RESTART_GATEWAY}
                  </p>
                </div>

                {/* Get Diagnostic */}
                <div className="rounded-md border p-4 space-y-3">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 text-left"
                    onClick={() =>
                      setActiveSection((prev) => (prev === 'quick' ? null : 'quick'))
                    }
                  >
                    <Stethoscope className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium flex-1">
                      {GATEWAY_STRINGS.BUTTON_GET_DIAGNOSTIC}
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${activeSection === 'quick' ? 'rotate-90' : ''}`}
                    />
                  </button>
                  {activeSection === 'quick' && (
                    <div className="space-y-2 pt-1">
                      <Label htmlFor="diag-type">{GATEWAY_STRINGS.LABEL_DIAGNOSTIC_TYPE}</Label>
                      <Select
                        value={diagnosticType}
                        onValueChange={(val) => {
                          setDiagnosticType(val);
                          setDiagnosticTypeError('');
                        }}
                      >
                        <SelectTrigger id="diag-type" className="w-full">
                          <SelectValue placeholder={GATEWAY_STRINGS.PLACEHOLDER_COMMAND_TYPE} />
                        </SelectTrigger>
                        <SelectContent>
                          {DIAGNOSTIC_TYPES.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {diagnosticTypeError && (
                        <p className="text-sm text-destructive">{diagnosticTypeError}</p>
                      )}
                      <Button size="sm" onClick={handleGetDiagnostic} className="w-full">
                        {GATEWAY_STRINGS.BUTTON_GET_DIAGNOSTIC}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Upload Log Files */}
                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {GATEWAY_STRINGS.BUTTON_UPLOAD_LOGS}
                      </span>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleUploadLogs}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Advanced Commands */}
              <div className="space-y-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-between"
                  onClick={() =>
                    setActiveSection((prev) => (prev === 'advanced' ? null : 'advanced'))
                  }
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Advanced Commands
                  </p>
                  <ChevronRight
                    className={`h-4 w-4 text-muted-foreground transition-transform ${activeSection === 'advanced' ? 'rotate-90' : ''}`}
                  />
                </button>
                {activeSection === 'advanced' && (
                  <div className="rounded-md border p-4 space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="adv-type">{GATEWAY_STRINGS.LABEL_COMMAND_TYPE}</Label>
                      <Select
                        value={advancedType}
                        onValueChange={(val) => {
                          setAdvancedType(val);
                          setAdvancedTypeError('');
                        }}
                      >
                        <SelectTrigger id="adv-type" className="w-full">
                          <SelectValue placeholder={GATEWAY_STRINGS.PLACEHOLDER_COMMAND_TYPE} />
                        </SelectTrigger>
                        <SelectContent>
                          {ADVANCED_COMMANDS.map((cmd) => (
                            <SelectItem key={cmd.value} value={cmd.value}>
                              {cmd.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {advancedTypeError && (
                        <p className="text-sm text-destructive">{advancedTypeError}</p>
                      )}
                    </div>
                    <Button size="sm" onClick={handleAdvancedProceed} className="w-full">
                      {UI_STRINGS.NEXT}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── CONFIGURE step (service_restart only) ─────────────── */}
          {step === 'configure' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {GATEWAY_STRINGS.LABEL_SERVICE_NAME}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="svc-name">{GATEWAY_STRINGS.LABEL_SERVICE_NAME}</Label>
                <Select
                  value={serviceName}
                  onValueChange={(val) => {
                    setServiceName(val);
                    setServiceNameError('');
                  }}
                >
                  <SelectTrigger id="svc-name" className="w-full">
                    <SelectValue placeholder={GATEWAY_STRINGS.PLACEHOLDER_COMMAND_TYPE} />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_NAMES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {serviceNameError && (
                  <p className="text-sm text-destructive">{serviceNameError}</p>
                )}
              </div>
            </div>
          )}

          {/* ── CONFIRM step ──────────────────────────────────────── */}
          {step === 'confirm' && selected && (
            <div className="flex items-start gap-3 rounded-md border border-yellow-400 bg-yellow-50 px-4 py-3 dark:bg-yellow-950">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {gateway
                  ? GATEWAY_STRINGS.CONFIRM_COMMAND_DESCRIPTION(selected.label, gateway.name)
                  : GATEWAY_STRINGS.CONFIRM_COMMAND_TITLE}
              </p>
            </div>
          )}

        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <DialogFooter className="shrink-0">
          {step === 'select' && (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {UI_STRINGS.CANCEL}
            </Button>
          )}

          {step === 'configure' && (
            <>
              <Button
                variant="outline"
                onClick={() => setStep('select')}
                disabled={isSubmitting}
              >
                {UI_STRINGS.BACK}
              </Button>
              <Button onClick={handleConfigureSubmit} disabled={isSubmitting}>
                {UI_STRINGS.NEXT}
              </Button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  // If service_restart, go back to configure; otherwise back to select
                  if (selected?.diagnostic_type === 'service_restart') {
                    setStep('configure');
                  } else {
                    setStep('select');
                  }
                }}
                disabled={isSubmitting}
              >
                {UI_STRINGS.BACK}
              </Button>
              <Button onClick={handleConfirm} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting
                  ? GATEWAY_STRINGS.BUTTON_SENDING
                  : GATEWAY_STRINGS.BUTTON_SEND_COMMAND}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendGatewayCommandDialog;
