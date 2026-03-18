// src/components/shared/CompanyFormDialog.tsx
// Dialog for creating and editing Companies (superadmin + company admin).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2 } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { useNetworkOptions } from "@/hooks/useNetworks";
import { cn } from "@/lib/utils";
import {
  createCompany,
  updateCompany,
} from "@/api/companies";
import type {
  Company,
  StoreCompanyPayload,
  UpdateCompanyPayload,
  UpdateOwnCompanyPayload,
} from "@/types/company";
import { COMPANY_STRINGS, UI_STRINGS } from "@/constants/strings";

export interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company;
  onSuccess: () => void;
}

const CODE_REGEX = /^[A-Z0-9_-]+$/;

export default function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  onSuccess,
}: CompanyFormDialogProps) {
  const { isSuperAdmin } = useRole();
  const superadmin = isSuperAdmin();

  const isEditMode = company !== undefined;

  const { options: networkOptions } = useNetworkOptions();

  const timezoneOptionsByRegion = useMemo(() => {
    try {
      if (
        typeof Intl !== "undefined" &&
        typeof Intl.supportedValuesOf === "function"
      ) {
        const all = Intl.supportedValuesOf("timeZone");
        const groups = new Map<string, string[]>();

        all.forEach((tz) => {
          const [region] = tz.split("/", 1);
          const key = region || "Other";
          const current = groups.get(key) ?? [];
          current.push(tz);
          groups.set(key, current);
        });

        return Array.from(groups.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([region, zones]) => ({
            region,
            zones: zones.sort((a, b) => a.localeCompare(b)),
          }));
      }
    } catch {
      // Fall through to minimal fallback below
    }

    return [
      {
        region: "UTC",
        zones: ["UTC"],
      },
    ];
  }, []);

  const [timezoneSearch, setTimezoneSearch] = useState<string>("");
  const [timezone, setTimezone] = useState<string>("");
  const [timezoneOpen, setTimezoneOpen] = useState<boolean>(false);
  const timezoneSearchInputRef = useRef<HTMLInputElement | null>(null);

  const filteredTimezoneGroups = useMemo(() => {
    const q = timezoneSearch.trim().toLowerCase();
    const selected = timezone;

    const groups = timezoneOptionsByRegion.map(({ region, zones }) => {
      const zonesFiltered =
        q === ""
          ? zones
          : zones.filter((tz) => tz.toLowerCase().includes(q));

      // Keep the currently selected timezone visible even if it doesn't match
      // the current query (prevents the "selected disappears" UX issue).
      if (selected && !zonesFiltered.includes(selected)) {
        if (zones.includes(selected)) {
          return { region, zones: [...zonesFiltered, selected] };
        }
      }

      return { region, zones: zonesFiltered };
    });

    return groups.filter(({ zones }) => zones.length > 0);
  }, [timezoneOptionsByRegion, timezoneSearch, timezone]);

  useEffect(() => {
    if (!timezoneOpen) return;
    const t = window.setTimeout(() => {
      timezoneSearchInputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [timezoneOpen]);

  useEffect(() => {
    if (!timezoneOpen) return;
    setTimezoneSearch("");
  }, [timezoneOpen]);

  const [code, setCode] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");

  const [loginAttempts, setLoginAttempts] = useState<number>(5);
  const [is2faEnforced, setIs2faEnforced] = useState<boolean>(false);

  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [isActiveZone, setIsActiveZone] = useState<boolean>(true);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [selectedNetworkIds, setSelectedNetworkIds] = useState<number[]>([]);
  const [networkSearch, setNetworkSearch] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isCodeValid = useMemo(() => {
    const upper = code.trim().toUpperCase();
    return CODE_REGEX.test(upper);
  }, [code]);

  useEffect(() => {
    if (!open) return;

    setTimezoneSearch("");

    setName(company?.name ?? "");
    setCode(company?.code ?? "");
    setAddress(company?.address ?? "");
    setContactEmail(company?.contact_email ?? "");
    setContactPhone(company?.contact_phone ?? "");

    setTimezone(company?.timezone ?? "UTC");

    setLoginAttempts(company?.login_attempts ?? 5);
    setIs2faEnforced(company?.is_2fa_enforced ?? false);

    setIsDemo(company?.is_demo ?? false);
    setIsActiveZone(company?.is_active_zone ?? true);
    setIsActive(company?.is_active ?? true);

    setSelectedNetworkIds(company?.networks.map((n) => n.id) ?? []);

    setIsSubmitting(false);
  }, [open, company]);

  const handleBlurCode = useCallback(() => {
    if (!superadmin) return;
    const upper = code.trim().toUpperCase();
    setCode(upper);
  }, [code, superadmin]);

  const toggleNetwork = useCallback((networkId: number, checked: boolean) => {
    setSelectedNetworkIds((prev) => {
      if (checked) {
        if (prev.includes(networkId)) return prev;
        return [...prev, networkId];
      }
      return prev.filter((id) => id !== networkId);
    });
  }, []);

  const filteredNetworks = useMemo(() => {
    const q = networkSearch.trim().toLowerCase();
    if (q === "") return networkOptions;
    return networkOptions.filter((network) => {
      const name = network.name.toLowerCase();
      const address = network.network_address.toLowerCase();
      return name.includes(q) || address.includes(q);
    });
  }, [networkOptions, networkSearch]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    if (superadmin) {
      if (!isEditMode && !isCodeValid) {
        toast.error(UI_STRINGS.ERROR_GENERIC);
        return;
      }
      if (!timezone.trim()) {
        toast.error(UI_STRINGS.ERROR_GENERIC);
        return;
      }
    } else {
      if (!company) {
        toast.error(UI_STRINGS.ERROR_GENERIC);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (superadmin) {
        if (isEditMode && company) {
          const payload: UpdateCompanyPayload = {
            name: name.trim(),
            address: address.trim() === "" ? null : address.trim(),
            contact_email: contactEmail.trim() === "" ? null : contactEmail.trim(),
            contact_phone: contactPhone.trim() === "" ? null : contactPhone.trim(),
            timezone,
            login_attempts: loginAttempts,
            is_2fa_enforced: is2faEnforced,
            is_demo: isDemo,
            is_active_zone: isActiveZone,
            is_active: isActive,
            network_ids: selectedNetworkIds,
          };

          await updateCompany(company.id, payload);
        } else {
          const payload: StoreCompanyPayload = {
            name: name.trim(),
            code: code.trim().toUpperCase(),
            address: address.trim() === "" ? null : address.trim(),
            contact_email: contactEmail.trim() === "" ? null : contactEmail.trim(),
            contact_phone: contactPhone.trim() === "" ? null : contactPhone.trim(),
            timezone,
            login_attempts: loginAttempts,
            is_2fa_enforced: is2faEnforced,
            is_demo: isDemo,
            is_active_zone: isActiveZone,
            is_active: isActive,
            network_ids: selectedNetworkIds,
          };

          await createCompany(payload);
        }
      } else {
        if (!company) {
          toast.error(UI_STRINGS.ERROR_GENERIC);
          return;
        }

        const payload: UpdateOwnCompanyPayload = {
          name: name.trim(),
          address: address.trim() === "" ? null : address.trim(),
          contact_email: contactEmail.trim() === "" ? null : contactEmail.trim(),
          contact_phone: contactPhone.trim() === "" ? null : contactPhone.trim(),
          timezone,
          login_attempts: loginAttempts,
          is_2fa_enforced: is2faEnforced,
        };

        const companyId = company.id;
        await updateCompany(companyId, payload);
      }

      toast.success(COMPANY_STRINGS.TOAST_SAVE_SUCCESS);
      onSuccess();
      onOpenChange(false);
    } catch (errorUnknown: unknown) {
      const message =
        errorUnknown instanceof Error && errorUnknown.message
          ? errorUnknown.message
          : COMPANY_STRINGS.TOAST_SAVE_ERROR;
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    superadmin,
    isEditMode,
    company,
    isCodeValid,
    timezone,
    name,
    code,
    address,
    contactEmail,
    contactPhone,
    loginAttempts,
    is2faEnforced,
    isDemo,
    isActiveZone,
    isActive,
    selectedNetworkIds,
    onSuccess,
    onOpenChange,
  ]);

  const canAttemptSubmit =
    superadmin ? isEditMode || isCodeValid : Boolean(company);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] flex flex-col gap-0">
        <form
          className="flex flex-col flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <DialogTitle>
              {company
                ? COMPANY_STRINGS.DIALOG_TITLE_EDIT
                : COMPANY_STRINGS.DIALOG_TITLE_CREATE}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 px-6 pb-2 space-y-6">
            {/* Section 1 — Identity */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!isEditMode && superadmin && (
                  <div className="space-y-2">
                    <Label htmlFor="company-code">{COMPANY_STRINGS.LABEL_CODE}</Label>
                    <Input
                      id="company-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder={COMPANY_STRINGS.CODE_PLACEHOLDER}
                      onBlur={handleBlurCode}
                      className="bg-background text-foreground dark:bg-background dark:text-foreground"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="company-name">{COMPANY_STRINGS.LABEL_NAME}</Label>
                  <Input
                    id="company-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background text-foreground dark:bg-background dark:text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-contact-email">
                    {COMPANY_STRINGS.LABEL_CONTACT_EMAIL}
                  </Label>
                  <Input
                    id="company-contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="bg-background text-foreground dark:bg-background dark:text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-contact-phone">
                    {COMPANY_STRINGS.LABEL_CONTACT_PHONE}
                  </Label>
                  <Input
                    id="company-contact-phone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="bg-background text-foreground dark:bg-background dark:text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-address">{COMPANY_STRINGS.LABEL_ADDRESS}</Label>
                <Textarea
                  id="company-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="bg-background text-foreground dark:bg-background dark:text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-timezone">
                  {COMPANY_STRINGS.LABEL_TIMEZONE}
                </Label>
                <Popover open={timezoneOpen} onOpenChange={setTimezoneOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start bg-background dark:bg-background"
                    >
                      <span className="truncate">
                        {timezone || UI_STRINGS.NONE}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-[var(--radix-popover-trigger-width)] max-w-full p-0"
                  >
                    <div className="max-h-64 overflow-y-auto">
                      <div className="sticky top-0 z-10 bg-popover px-2 pb-1 pt-2 border-b border-border/60 dark:border-border/60">
                        <Input
                          id="company-timezone-search"
                          ref={timezoneSearchInputRef}
                          value={timezoneSearch}
                          placeholder={UI_STRINGS.SEARCH}
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            setTimezoneSearch(event.target.value)
                          }
                          className="h-8 bg-background text-foreground dark:bg-background dark:text-foreground"
                        />
                      </div>

                      {filteredTimezoneGroups.map(({ region, zones }) => (
                        <div key={region} className="px-2 py-1">
                          <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">
                            {region}
                          </p>
                          <div className="space-y-1">
                            {zones.map((tz) => {
                              const isSelected = tz === timezone;
                              return (
                                <button
                                  key={tz}
                                  type="button"
                                  className={cn(
                                    "w-full rounded-md px-2 py-1 text-left text-sm hover:bg-muted dark:hover:bg-muted",
                                    isSelected && "bg-muted"
                                  )}
                                  onClick={() => {
                                    setTimezone(tz);
                                    setTimezoneOpen(false);
                                  }}
                                >
                                  <span className="block truncate">{tz}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {filteredTimezoneGroups.length === 0 && (
                        <p className="px-2 py-3 text-sm text-muted-foreground">
                          {UI_STRINGS.NO_RESULTS}
                        </p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Section 2 — Security */}
            <section className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-login-attempts">
                    {COMPANY_STRINGS.LABEL_LOGIN_ATTEMPTS}
                  </Label>
                  <Input
                    id="company-login-attempts"
                    type="number"
                    min={1}
                    max={10}
                    value={loginAttempts}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (!Number.isFinite(next)) return;
                      setLoginAttempts(Math.max(1, Math.min(10, next)));
                    }}
                    className="bg-background text-foreground dark:bg-background dark:text-foreground"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="company-2fa"
                    checked={is2faEnforced}
                    onCheckedChange={setIs2faEnforced}
                  />
                  <Label htmlFor="company-2fa" className="whitespace-nowrap">
                    {COMPANY_STRINGS.LABEL_2FA_ENFORCED}
                  </Label>
                </div>
              </div>
            </section>

            {/* Section 3 — Flags (superadmin only) */}
            {superadmin && (
              <section className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="company-is-demo"
                      checked={isDemo}
                      onCheckedChange={setIsDemo}
                    />
                    <Label htmlFor="company-is-demo">
                      {COMPANY_STRINGS.LABEL_IS_DEMO}
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      id="company-is-active-zone"
                      checked={isActiveZone}
                      onCheckedChange={setIsActiveZone}
                    />
                    <Label htmlFor="company-is-active-zone">
                      {COMPANY_STRINGS.LABEL_IS_ACTIVE_ZONE}
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      id="company-is-active"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                    <Label htmlFor="company-is-active">
                      {COMPANY_STRINGS.LABEL_IS_ACTIVE}
                    </Label>
                  </div>
                </div>
              </section>
            )}

            {/* Section 4 — Networks (superadmin only) */}
            {superadmin && (
              <section className="space-y-2">
                <div className="space-y-2">
                  <Label>{COMPANY_STRINGS.LABEL_NETWORKS}</Label>
                  <div className="space-y-2">
                    <Input
                      value={networkSearch}
                      onChange={(e) => setNetworkSearch(e.target.value)}
                      placeholder={UI_STRINGS.SEARCH}
                      className="h-8 bg-background text-foreground dark:bg-background dark:text-foreground"
                    />
                    <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1 bg-background dark:bg-background">
                      {filteredNetworks.map((network) => {
                        const checked = selectedNetworkIds.includes(network.id);
                        return (
                          <label
                            key={network.id}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) =>
                                toggleNetwork(network.id, Boolean(v))
                              }
                            />
                            <span className="truncate">{network.name}</span>
                            <span className="ml-auto font-mono text-xs text-muted-foreground">
                              {network.network_address}
                            </span>
                          </label>
                        );
                      })}
                      {filteredNetworks.length === 0 && (
                        <p className="px-1 py-1 text-xs text-muted-foreground">
                          {UI_STRINGS.NO_RESULTS}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          <DialogFooter className="px-6 py-4 shrink-0 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {UI_STRINGS.CANCEL}
            </Button>

            <Button type="submit" disabled={isSubmitting} aria-disabled={!canAttemptSubmit}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}
              {isEditMode
                ? COMPANY_STRINGS.BUTTON_UPDATE
                : COMPANY_STRINGS.BUTTON_CREATE}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

