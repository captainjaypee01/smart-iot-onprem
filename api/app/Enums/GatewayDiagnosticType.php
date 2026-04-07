<?php

declare(strict_types=1);

namespace App\Enums;

enum GatewayDiagnosticType: string
{
    case ServiceRestart = 'service_restart';
    case CheckUtilization = 'check_utilization';
    case CurrentTime = 'current_time';
    case SyncTime = 'sync_time';
    case NetworkIdNotOk = 'network_id_not_ok';
    case LocalEnvironmentSettings = 'local_environment_settings';
    case CheckSimImei = 'check_sim_imei';
    case UploadFile = 'upload_file';
}
