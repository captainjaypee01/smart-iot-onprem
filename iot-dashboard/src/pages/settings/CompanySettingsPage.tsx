// src/pages/settings/CompanySettingsPage.tsx
// Company admin self-edit settings page.

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useCompany, useUpdateOwnCompany, useUploadCompanyLogo } from "@/hooks/useCompanies";
import type { UpdateOwnCompanyPayload } from "@/types/company";
import { UI_STRINGS } from "@/constants/strings";
import { COMPANY_STRINGS } from "@/constants/strings";

export default function CompanySettingsPage() {
  const user = useAuthStore((s) => s.user);
  const companyId = user?.company?.id ?? null;

  const { company, isLoading, refetch } = useCompany(companyId);
  const { updateOwnCompany, isSubmitting } = useUpdateOwnCompany();
  const { uploadCompanyLogo, isUploading } = useUploadCompanyLogo();

  const [name, setName] = useState<string>("");
  const [timezone, setTimezone] = useState<string>("");
  const [timezoneSearch, setTimezoneSearch] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [address, setAddress] = useState<string>("");

  const [loginAttempts, setLoginAttempts] = useState<number>(5);
  const [is2faEnforced, setIs2faEnforced] = useState<boolean>(false);

  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const timezoneOptions = useMemo(() => {
    if (
      typeof Intl !== "undefined" &&
      typeof Intl.supportedValuesOf === "function"
    ) {
      try {
        const options = Intl.supportedValuesOf("timeZone");
        return Array.isArray(options) ? options : [];
      } catch {
        return [];
      }
    }

    return company?.timezone ? [company.timezone] : [];
  }, [company?.timezone]);

  const filteredTimezoneOptions = useMemo(() => {
    const q = timezoneSearch.trim().toLowerCase();
    if (q === "") return timezoneOptions;
    return timezoneOptions.filter((tz) => tz.toLowerCase().includes(q));
  }, [timezoneOptions, timezoneSearch]);

  useEffect(() => {
    if (!company) return;

    setName(company.name ?? "");
    setTimezone(company.timezone ?? "");
    setContactEmail(company.contact_email ?? "");
    setContactPhone(company.contact_phone ?? "");
    setAddress(company.address ?? "");
    setLoginAttempts(company.login_attempts);
    setIs2faEnforced(company.is_2fa_enforced);
    setLogoPreviewUrl(company.logo_url);
  }, [company]);

  const handleSaveGeneral = useCallback(async () => {
    if (!company) return;

    const payload: UpdateOwnCompanyPayload = {
      name: name.trim(),
      timezone,
      contact_email: contactEmail.trim() === "" ? null : contactEmail.trim(),
      contact_phone: contactPhone.trim() === "" ? null : contactPhone.trim(),
      address: address.trim() === "" ? null : address.trim(),
    };

    try {
      const normalized = payload;
      await updateOwnCompany(company.id, normalized);
      toast.success(COMPANY_STRINGS.TOAST_SAVE_SUCCESS);
      await refetch();
    } catch {
      toast.error(COMPANY_STRINGS.TOAST_SAVE_ERROR);
    }
  }, [
    company,
    name,
    timezone,
    contactEmail,
    contactPhone,
    address,
    updateOwnCompany,
    refetch,
  ]);

  const handleSaveSecurity = useCallback(async () => {
    if (!company) return;

    const payload: UpdateOwnCompanyPayload = {
      login_attempts: loginAttempts,
      is_2fa_enforced: is2faEnforced,
    };

    try {
      const normalized = payload;
      await updateOwnCompany(company.id, normalized);
      toast.success(COMPANY_STRINGS.TOAST_SAVE_SUCCESS);
      await refetch();
    } catch {
      toast.error(COMPANY_STRINGS.TOAST_SAVE_ERROR);
    }
  }, [company, loginAttempts, is2faEnforced, updateOwnCompany, refetch]);

  const handleUploadLogo = useCallback(async () => {
    if (!company || !logoFile) return;

    try {
      const updated = await uploadCompanyLogo(company.id, logoFile);
      setLogoPreviewUrl(updated.logo_url);
      setLogoFile(null);
      toast.success(COMPANY_STRINGS.TOAST_LOGO_SUCCESS);
    } catch {
      toast.error(COMPANY_STRINGS.TOAST_LOGO_ERROR);
    } finally {
      await refetch();
    }
  }, [company, logoFile, uploadCompanyLogo, refetch]);

  if (user?.is_superadmin) return null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-28 w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-5 w-24" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-40" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{COMPANY_STRINGS.CARD_GENERAL_TITLE}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-settings-name">
                {COMPANY_STRINGS.LABEL_NAME}
              </Label>
              <Input
                id="company-settings-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-settings-timezone">
                {COMPANY_STRINGS.LABEL_TIMEZONE}
              </Label>
              <Input
                id="company-settings-timezone-search"
                value={timezoneSearch}
                placeholder={UI_STRINGS.SEARCH}
                onChange={(e) => setTimezoneSearch(e.target.value)}
                disabled={isSubmitting}
              />
              <Select value={timezone} onValueChange={setTimezone} disabled={isSubmitting}>
                <SelectTrigger id="company-settings-timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {filteredTimezoneOptions.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-settings-contact-email">
                {COMPANY_STRINGS.LABEL_CONTACT_EMAIL}
              </Label>
              <Input
                id="company-settings-contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-settings-contact-phone">
                {COMPANY_STRINGS.LABEL_CONTACT_PHONE}
              </Label>
              <Input
                id="company-settings-contact-phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-settings-address">
              {COMPANY_STRINGS.LABEL_ADDRESS}
            </Label>
            <Textarea
              id="company-settings-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button onClick={() => void handleSaveGeneral()} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {UI_STRINGS.SAVE}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{COMPANY_STRINGS.CARD_SECURITY_TITLE}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-settings-login-attempts">
                {COMPANY_STRINGS.LABEL_LOGIN_ATTEMPTS}
              </Label>
              <Input
                id="company-settings-login-attempts"
                type="number"
                min={1}
                max={10}
                value={loginAttempts}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  if (!Number.isFinite(next)) return;
                  setLoginAttempts(Math.max(1, Math.min(10, next)));
                }}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <Switch
                id="company-settings-2fa"
                checked={is2faEnforced}
                onCheckedChange={setIs2faEnforced}
                disabled={isSubmitting}
              />
              <Label htmlFor="company-settings-2fa">
                {COMPANY_STRINGS.LABEL_2FA_ENFORCED}
              </Label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button onClick={() => void handleSaveSecurity()} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {UI_STRINGS.SAVE}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{COMPANY_STRINGS.LABEL_COMPANY_LOGO}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {logoPreviewUrl && (
            <div className="space-y-2">
              <Label>{COMPANY_STRINGS.LABEL_CURRENT_LOGO_PREVIEW}</Label>
              <img
                src={logoPreviewUrl}
                alt={COMPANY_STRINGS.LABEL_COMPANY_LOGO}
                className="h-20 w-auto rounded-md object-contain border border-border"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="company-settings-logo-upload">
              {COMPANY_STRINGS.LABEL_COMPANY_LOGO}
            </Label>
            <Input
              id="company-settings-logo-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const next = e.target.files?.[0] ?? null;
                setLogoFile(next);
              }}
              disabled={isUploading}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={() => void handleUploadLogo()}
              disabled={isUploading || logoFile === null}
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {COMPANY_STRINGS.UPLOAD_LOGO}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

