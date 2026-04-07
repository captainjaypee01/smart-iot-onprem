<?php

// app/Actions/Companies/StoreCompanyAction.php

declare(strict_types=1);

namespace App\Actions\Companies;

use App\DTO\Companies\StoreCompanyDTO;
use App\Models\Company;

final class StoreCompanyAction
{
    public function execute(StoreCompanyDTO $dto): Company
    {
        $company = new Company;

        $company->name = $dto->name;
        $company->code = \strtoupper($dto->code);
        $company->address = $dto->address;
        $company->contact_email = $dto->contactEmail;
        $company->contact_phone = $dto->contactPhone;
        $company->timezone = $dto->timezone;
        $company->login_attempts = $dto->loginAttempts;
        $company->is_2fa_enforced = $dto->is2faEnforced;
        $company->is_demo = $dto->isDemo;
        $company->is_active_zone = $dto->isActiveZone;
        $company->is_active = $dto->isActive;
        $company->custom_alarm_threshold = $dto->customAlarmThreshold;
        $company->custom_alarm_threshold_unit = $dto->customAlarmThresholdUnit instanceof \App\Enums\AlarmThresholdUnit
            ? $dto->customAlarmThresholdUnit->value
            : $dto->customAlarmThresholdUnit;

        $company->save();

        $company->networks()->sync($dto->networkIds ?? []);

        return $company->load('networks');
    }
}
