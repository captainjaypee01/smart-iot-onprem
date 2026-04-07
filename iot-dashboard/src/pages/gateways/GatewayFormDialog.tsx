// src/pages/gateways/GatewayFormDialog.tsx
// Dialog for creating and editing a Gateway.

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useCreateGateway, useUpdateGateway } from '@/hooks/useGateways';
import type { Gateway } from '@/types/gateway';
import type { NetworkOption } from '@/types/network';
import { GATEWAY_STRINGS, UI_STRINGS } from '@/constants/strings';

export interface GatewayFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided the dialog is in edit mode; otherwise create mode. */
  gateway?: Gateway;
  onSuccess: () => void;
  /** Network options lifted from the parent list page to avoid duplicate fetches. */
  networkOptions: NetworkOption[];
  networksLoading: boolean;
}

const GATEWAY_PREFIX_REGEX = /^[A-Z0-9]+$/;

export const GatewayFormDialog = ({
  open,
  onOpenChange,
  gateway,
  onSuccess,
  networkOptions,
  networksLoading,
}: GatewayFormDialogProps) => {
  const isEdit = gateway !== undefined;

  const [networkId, setNetworkId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [gatewayPrefix, setGatewayPrefix] = useState<string>('');
  const [serviceId, setServiceId] = useState<string>('');
  const [assetId, setAssetId] = useState<string>('');
  const [deviceKey, setDeviceKey] = useState<string>('');
  const [location, setLocation] = useState<string>('');

  const [prefixError, setPrefixError] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [networkError, setNetworkError] = useState<string>('');
  const [descriptionError, setDescriptionError] = useState<string>('');
  const [serviceIdError, setServiceIdError] = useState<string>('');

  const { create, isSubmitting: isCreating } = useCreateGateway();
  const { update, isSubmitting: isUpdating } = useUpdateGateway();
  const isSubmitting = isCreating || isUpdating;

  // Derive the selected network's existing gateway_prefix (if any).
  const selectedNetwork = networkOptions.find((n) => String(n.id) === networkId);
  const networkAlreadyHasPrefix = Boolean(selectedNetwork?.gateway_prefix);

  // Reset form when dialog opens/closes or gateway changes
  useEffect(() => {
    if (open) {
      if (isEdit && gateway) {
        setNetworkId(String(gateway.network_id));
        setName(gateway.name);
        setDescription(gateway.description ?? '');
        setIsTestMode(gateway.is_test_mode);
        setGatewayPrefix('');
        setServiceId(gateway.service_id ?? '');
        setAssetId(gateway.asset_id ?? '');
        setDeviceKey(gateway.device_key ?? '');
        setLocation(gateway.location ?? '');
      } else {
        setNetworkId('');
        setName('');
        setDescription('');
        setIsTestMode(false);
        setGatewayPrefix('');
        setServiceId('');
        setAssetId('');
        setDeviceKey('');
        setLocation('');
      }
      setPrefixError('');
      setNameError('');
      setNetworkError('');
      setDescriptionError('');
      setServiceIdError('');
    }
  }, [open, isEdit, gateway]);

  const validate = useCallback((): boolean => {
    let valid = true;

    if (!networkId && !isEdit) {
      setNetworkError(GATEWAY_STRINGS.ERROR_NETWORK_REQUIRED);
      valid = false;
    } else {
      setNetworkError('');
    }

    if (!name.trim()) {
      setNameError(GATEWAY_STRINGS.ERROR_NAME_REQUIRED);
      valid = false;
    } else {
      setNameError('');
    }

    if (!serviceId.trim()) {
      setServiceIdError(GATEWAY_STRINGS.ERROR_SERVICE_ID_REQUIRED);
      valid = false;
    } else {
      setServiceIdError('');
    }

    const desc = description.trim();
    if (desc.length > 1000) {
      setDescriptionError(GATEWAY_STRINGS.ERROR_DESCRIPTION_MAX);
      valid = false;
    } else {
      setDescriptionError('');
    }

    if (!isEdit && networkId && !networkAlreadyHasPrefix) {
      const p = gatewayPrefix.trim();
      if (!p) {
        setPrefixError(GATEWAY_STRINGS.ERROR_PREFIX_REQUIRED);
        valid = false;
      } else if (!GATEWAY_PREFIX_REGEX.test(p)) {
        setPrefixError(GATEWAY_STRINGS.ERROR_PREFIX_INVALID);
        valid = false;
      } else if (p.length > 10) {
        setPrefixError(GATEWAY_STRINGS.ERROR_PREFIX_MAX);
        valid = false;
      } else {
        setPrefixError('');
      }
    } else if (!isEdit && networkId && networkAlreadyHasPrefix) {
      setPrefixError('');
    } else if (!isEdit) {
      setPrefixError('');
    } else {
      setPrefixError('');
    }

    return valid;
  }, [networkId, isEdit, name, serviceId, description, gatewayPrefix, networkAlreadyHasPrefix]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    try {
      if (isEdit && gateway) {
        await update(gateway.id, {
          name: name.trim(),
          description: description.trim() || null,
          is_test_mode: isTestMode,
          service_id: serviceId.trim(),
          asset_id: assetId.trim() || null,
          device_key: deviceKey.trim() || null,
          location: location.trim() || null,
        });
        toast.success(GATEWAY_STRINGS.SUCCESS_UPDATE);
      } else {
        await create({
          network_id: Number(networkId),
          name: name.trim(),
          service_id: serviceId.trim(),
          description: description.trim() || null,
          asset_id: assetId.trim() || null,
          device_key: deviceKey.trim() || null,
          location: location.trim() || null,
          ...(gatewayPrefix.trim()
            ? { gateway_prefix: gatewayPrefix.trim().toUpperCase() }
            : {}),
        });
        toast.success(GATEWAY_STRINGS.SUCCESS_CREATE);
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : isEdit ? GATEWAY_STRINGS.ERROR_UPDATE : GATEWAY_STRINGS.ERROR_CREATE;
      toast.error(message);
    }
  }, [
    validate,
    isEdit,
    gateway,
    update,
    create,
    name,
    description,
    isTestMode,
    networkId,
    gatewayPrefix,
    serviceId,
    assetId,
    deviceKey,
    location,
    onSuccess,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {isEdit ? GATEWAY_STRINGS.DIALOG_TITLE_EDIT : GATEWAY_STRINGS.DIALOG_TITLE_CREATE}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-1 space-y-5">
          {/* Network — create only */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="gw-network">{GATEWAY_STRINGS.LABEL_NETWORK}</Label>
              <Select
                value={networkId}
                onValueChange={(val) => {
                  setNetworkId(val);
                  setNetworkError('');
                }}
                disabled={networksLoading}
              >
                <SelectTrigger id="gw-network" className="w-full">
                  <SelectValue placeholder={GATEWAY_STRINGS.PLACEHOLDER_NETWORK} />
                </SelectTrigger>
                <SelectContent>
                  {networkOptions.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {networkError && (
                <p className="text-sm text-destructive">{networkError}</p>
              )}
            </div>
          )}

          {/* Gateway ID & Sink ID — edit only, read-only */}
          {isEdit && gateway && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{GATEWAY_STRINGS.LABEL_GATEWAY_ID}</Label>
                <Input value={gateway.gateway_id} readOnly className="font-mono bg-muted" />
                <p className="text-xs text-muted-foreground">
                  {GATEWAY_STRINGS.GATEWAY_ID_READONLY_HELPER}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>{GATEWAY_STRINGS.LABEL_SINK_ID}</Label>
                <Input value={gateway.sink_id} readOnly className="font-mono bg-muted" />
              </div>
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="gw-name">{GATEWAY_STRINGS.LABEL_NAME}</Label>
            <Input
              id="gw-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError('');
              }}
              placeholder={GATEWAY_STRINGS.PLACEHOLDER_NAME}
            />
            {nameError && <p className="text-sm text-destructive">{nameError}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="gw-description">{GATEWAY_STRINGS.LABEL_DESCRIPTION}</Label>
            <Textarea
              id="gw-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setDescriptionError('');
              }}
              placeholder={GATEWAY_STRINGS.PLACEHOLDER_DESCRIPTION}
              rows={3}
            />
            {descriptionError && (
              <p className="text-sm text-destructive">{descriptionError}</p>
            )}
          </div>

          {/* Gateway Prefix — create only, and only when network has no prefix yet */}
          {!isEdit && networkId && (
            networkAlreadyHasPrefix ? (
              <div className="space-y-1.5">
                <Label>{GATEWAY_STRINGS.LABEL_GATEWAY_PREFIX}</Label>
                <Input
                  value={selectedNetwork?.gateway_prefix ?? ''}
                  readOnly
                  className="font-mono bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {GATEWAY_STRINGS.GATEWAY_PREFIX_ALREADY_SET}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="gw-prefix">{GATEWAY_STRINGS.LABEL_GATEWAY_PREFIX}</Label>
                <Input
                  id="gw-prefix"
                  value={gatewayPrefix}
                  onChange={(e) => {
                    setGatewayPrefix(e.target.value.toUpperCase());
                    setPrefixError('');
                  }}
                  placeholder={GATEWAY_STRINGS.PLACEHOLDER_GATEWAY_PREFIX}
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  {GATEWAY_STRINGS.GATEWAY_PREFIX_HELPER}
                </p>
                {prefixError && <p className="text-sm text-destructive">{prefixError}</p>}
              </div>
            )
          )}

          {/* Service ID | Asset ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="gw-service-id">
                {GATEWAY_STRINGS.LABEL_SERVICE_ID}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="gw-service-id"
                value={serviceId}
                onChange={(e) => {
                  setServiceId(e.target.value);
                  setServiceIdError('');
                }}
                placeholder={GATEWAY_STRINGS.PLACEHOLDER_SERVICE_ID}
              />
              {serviceIdError && (
                <p className="text-sm text-destructive">{serviceIdError}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gw-asset-id">{GATEWAY_STRINGS.LABEL_ASSET_ID}</Label>
              <Input
                id="gw-asset-id"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                placeholder={GATEWAY_STRINGS.PLACEHOLDER_ASSET_ID}
              />
            </div>
          </div>

          {/* Device Key | Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="gw-device-key">{GATEWAY_STRINGS.LABEL_DEVICE_KEY}</Label>
              <Input
                id="gw-device-key"
                value={deviceKey}
                onChange={(e) => setDeviceKey(e.target.value)}
                placeholder={GATEWAY_STRINGS.PLACEHOLDER_DEVICE_KEY}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gw-location">{GATEWAY_STRINGS.LABEL_LOCATION}</Label>
              <Input
                id="gw-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={GATEWAY_STRINGS.PLACEHOLDER_LOCATION}
              />
            </div>
          </div>

          {/* IP Address | Gateway Version — edit only, both read-only (auto-populated by IoT service) */}
          {isEdit && gateway && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{GATEWAY_STRINGS.LABEL_IP_ADDRESS}</Label>
                <Input
                  value={gateway.ip_address ?? ''}
                  readOnly
                  disabled
                  className="bg-muted font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  {GATEWAY_STRINGS.IP_ADDRESS_HELPER}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>{GATEWAY_STRINGS.LABEL_GATEWAY_VERSION}</Label>
                <Input
                  value={gateway.gateway_version ?? ''}
                  readOnly
                  disabled
                  className="bg-muted font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  {GATEWAY_STRINGS.GATEWAY_VERSION_HELPER}
                </p>
              </div>
            </div>
          )}

          {/* Test Mode — edit only (contract: create flow does not set test mode) */}
          {isEdit && (
            <div className="flex items-center gap-3">
              <Switch
                id="gw-test-mode"
                checked={isTestMode}
                onCheckedChange={setIsTestMode}
              />
              <Label htmlFor="gw-test-mode">{GATEWAY_STRINGS.LABEL_IS_TEST_MODE}</Label>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {UI_STRINGS.CANCEL}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? GATEWAY_STRINGS.BUTTON_UPDATE : GATEWAY_STRINGS.BUTTON_CREATE}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GatewayFormDialog;
