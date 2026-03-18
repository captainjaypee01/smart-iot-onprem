// src/api/companies.ts
// API functions for Company module endpoints

import axiosClient from './axiosClient';
import type {
  Company,
  CompanyListResponse,
  CompanyOption,
  StoreCompanyPayload,
  UpdateCompanyPayload,
  UpdateOwnCompanyPayload,
} from '@/types/company';

export const getCompanies = async (params?: {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: 0 | 1;
  is_demo?: 0 | 1;
}): Promise<CompanyListResponse> => {
  const res = await axiosClient.get('/v1/companies', { params });
  return res.data;
};

export const getCompanyOptions = async (): Promise<{ data: CompanyOption[] }> => {
  const res = await axiosClient.get('/v1/companies/options');
  return res.data;
};

export const getCompany = async (id: number): Promise<{ data: Company }> => {
  const res = await axiosClient.get(`/v1/companies/${id}`);
  return res.data;
};

export const createCompany = async (
  payload: StoreCompanyPayload,
): Promise<{ data: Company }> => {
  const res = await axiosClient.post('/v1/companies', payload);
  return res.data;
};

export const updateCompany = async (
  id: number,
  payload: UpdateCompanyPayload | UpdateOwnCompanyPayload,
): Promise<{ data: Company }> => {
  const res = await axiosClient.put(`/v1/companies/${id}`, payload);
  return res.data;
};

export const deleteCompany = async (id: number): Promise<void> => {
  await axiosClient.delete(`/v1/companies/${id}`);
};

export const uploadCompanyLogo = async (
  id: number,
  file: File,
): Promise<{ data: Company }> => {
  const form = new FormData();
  form.append('logo', file);

  const res = await axiosClient.post(`/v1/companies/${id}/logo`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return res.data;
};

