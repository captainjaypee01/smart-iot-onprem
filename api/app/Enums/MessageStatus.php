<?php

declare(strict_types=1);

namespace App\Enums;

enum MessageStatus: int
{
    case NodeResponded = 1;
    case NodeRespondedError = 2;
    case WaitingResponse = 3;
    case AlarmAcknowledge = 4;
    case GroupMessage = 5;
    case NetworkMessage = 6;
    case GatewayResponded = 7;
    case SinkMessage = 8;
    case ZoneMessage = 9;
    case ZoneGroupMessage = 10;

    public function label(): string
    {
        return match ($this) {
            self::NodeResponded => 'Node Responded',
            self::NodeRespondedError => 'Node Responded with Error',
            self::WaitingResponse => 'Waiting for Response from Node',
            self::AlarmAcknowledge => 'Alarm Acknowledge',
            self::GroupMessage => 'Group Message',
            self::NetworkMessage => 'Network Message',
            self::GatewayResponded => 'Gateway Responded',
            self::SinkMessage => 'Sink Message',
            self::ZoneMessage => 'Zone Message',
            self::ZoneGroupMessage => 'Zone Group Message',
        };
    }
}
