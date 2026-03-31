<?php

declare(strict_types=1);

namespace App\Enums;

enum NodeStatus: string
{
    case New = 'new';
    case Active = 'active';
    case Decommissioned = 'decommissioned';
}
