<?php

declare(strict_types=1);

// app/Http/Resources/Api/V1/Companies/CompanyResource.php
// JSON shape for a company, as per docs/specs/company-module-contract.md.

namespace App\Http\Resources\Api\V1\Companies;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CompanyResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Company $company */
        $company = $this->resource;

        $networks = $company->relationLoaded('networks')
            ? $company->networks->map(static fn ($network): array => [
                'id' => $network->id,
                'name' => $network->name,
                'network_address' => $network->network_address,
            ])->all()
            : [];

        return [
            'id' => $company->id,
            'code' => $company->code,
            'name' => $company->name,
            'address' => $company->address,
            'contact_email' => $company->contact_email,
            'contact_phone' => $company->contact_phone,
            'timezone' => $company->timezone,
            'logo_url' => $company->logo_path
                ? Storage::url($company->logo_path)
                : null,
            'login_attempts' => $company->login_attempts,
            'is_2fa_enforced' => (bool) $company->is_2fa_enforced,
            'is_demo' => (bool) $company->is_demo,
            'is_active_zone' => (bool) $company->is_active_zone,
            'is_active' => (bool) $company->is_active,
            'custom_alarm_threshold' => $company->custom_alarm_threshold,
            'custom_alarm_threshold_unit' => $company->custom_alarm_threshold_unit,
            'networks' => $networks,
            'networks_count' => \count($networks),
            'users_count' => $company->users()->count(),
            'created_at' => $company->created_at?->toIso8601String(),
            'updated_at' => $company->updated_at?->toIso8601String(),
        ];
    }
}
