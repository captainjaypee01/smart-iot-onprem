// src/types/company.ts
// TypeScript interfaces for the Company module shared between API and frontend

export type AlarmThresholdUnit = 'minutes' | 'hours';

export interface CompanyNetwork {
  id: number;
  name: string;
  network_address: string;
}

export interface Company {
  id: number;
  code: string;
  name: string;
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  timezone: string;
  logo_url: string | null;
  login_attempts: number;
  is_2fa_enforced: boolean;
  is_demo: boolean;
  is_active_zone: boolean;
  is_active: boolean;
  custom_alarm_threshold: number | null;
  custom_alarm_threshold_unit: AlarmThresholdUnit | null;
  networks: CompanyNetwork[];
  networks_count: number;
  users_count: number;
  created_at: string;
  updated_at: string;
}

export interface CompanyListResponse {
  data: Company[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links: {
    first: string;
    next: string | null;
    prev: string | null;
    last: string;
  };
}

export interface CompanyOption {
  id: number;
  name: string;
  code: string;
}

export interface StoreCompanyPayload {
  name: string;
  code: string;
  address?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  timezone: string;
  login_attempts?: number;
  is_2fa_enforced?: boolean;
  is_demo?: boolean;
  is_active_zone?: boolean;
  is_active?: boolean;
  custom_alarm_threshold?: number | null;
  custom_alarm_threshold_unit?: AlarmThresholdUnit | null;
  network_ids?: number[];
}

export interface UpdateCompanyPayload extends Partial<Omit<StoreCompanyPayload, 'code'>> {}

export interface UpdateOwnCompanyPayload {
  name?: string;
  address?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  timezone?: string;
  login_attempts?: number;
  is_2fa_enforced?: boolean;
}

