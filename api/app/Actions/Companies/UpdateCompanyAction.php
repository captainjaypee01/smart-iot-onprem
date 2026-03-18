<?php
// app/Actions/Companies/UpdateCompanyAction.php

declare(strict_types=1);

namespace App\Actions\Companies;

use App\DTO\Companies\UpdateCompanyDTO;
use App\Models\Company;

final class UpdateCompanyAction
{
    public function execute(Company $company, UpdateCompanyDTO $dto): Company
    {
        if ($dto->name !== null) {
            $company->name = $dto->name;
        }

        if ($dto->code !== null) {
            $company->code = \strtoupper($dto->code);
        }

        if ($dto->address !== null) {
            $company->address = $dto->address;
        }

        if ($dto->contactEmail !== null) {
            $company->contact_email = $dto->contactEmail;
        }

        if ($dto->contactPhone !== null) {
            $company->contact_phone = $dto->contactPhone;
        }

        if ($dto->timezone !== null) {
            $company->timezone = $dto->timezone;
        }

        if ($dto->loginAttempts !== null) {
            $company->login_attempts = $dto->loginAttempts;
        }

        if ($dto->is2faEnforced !== null) {
            $company->is_2fa_enforced = $dto->is2faEnforced;
        }

        if ($dto->isDemo !== null) {
            $company->is_demo = $dto->isDemo;
        }

        if ($dto->isActiveZone !== null) {
            $company->is_active_zone = $dto->isActiveZone;
        }

        if ($dto->isActive !== null) {
            $company->is_active = $dto->isActive;
        }

        if ($dto->customAlarmThreshold !== null || $dto->customAlarmThresholdUnit !== null) {
            $company->custom_alarm_threshold = $dto->customAlarmThreshold;
            $company->custom_alarm_threshold_unit = $dto->customAlarmThresholdUnit instanceof \App\Enums\AlarmThresholdUnit
                ? $dto->customAlarmThresholdUnit->value
                : $dto->customAlarmThresholdUnit;
        }

        $company->save();

        if (\is_array($dto->networkIds)) {
            $company->networks()->sync($dto->networkIds);
        }

        return $company->load('networks');
    }
}

