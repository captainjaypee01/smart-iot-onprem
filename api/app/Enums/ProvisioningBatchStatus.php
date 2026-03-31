<?php

declare(strict_types=1);

namespace App\Enums;

enum ProvisioningBatchStatus: string
{
    case Pending = 'pending';
    case Partial = 'partial';
    case Complete = 'complete';
    case Failed = 'failed';
}
