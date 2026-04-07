<?php

declare(strict_types=1);

namespace App\Enums;

enum GatewayServiceName: string
{
    case WirepasSink = 'wirepasSink1';
    case WirepasTransport = 'wirepasTransport';
    case Watchdog = 'watchdog';
    case Fail2ban = 'fail2ban';
    case Redis = 'redis';
    case RestartHat = 'restart_hat';
    case QmiReconnect = 'qmi_reconnect';
    case Rsyslog = 'rsyslog';
}
