<?php

declare(strict_types=1);

namespace App\Enums;

enum ProvisioningNodeStatus: string
{
    case Pending = 'pending';
    case Provisioned = 'provisioned';
    case Failed = 'failed';
}
