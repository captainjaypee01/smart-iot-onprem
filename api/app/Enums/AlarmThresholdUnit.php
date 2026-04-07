<?php

// app/Enums/AlarmThresholdUnit.php — must stay in sync with ALARM_THRESHOLD_UNIT_OPTIONS

declare(strict_types=1);

namespace App\Enums;

enum AlarmThresholdUnit: string
{
    case MINUTES = 'minutes';
    case HOURS = 'hours';
}
