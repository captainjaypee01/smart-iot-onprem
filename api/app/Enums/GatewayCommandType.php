<?php

declare(strict_types=1);

namespace App\Enums;

enum GatewayCommandType: string
{
    case RestartGateway = 'restart_gateway';
    case GetConfigs = 'get_configs';
    case OtapLoadScratchpad = 'otap_load_scratchpad';
    case OtapProcessScratchpad = 'otap_process_scratchpad';
    case OtapSetTargetScratchpad = 'otap_set_target_scratchpad';
    case OtapStatus = 'otap_status';
    case UploadSoftwareUpdate = 'upload_software_update';
    case Diagnostic = 'diagnostic';
    case SyncGatewayTime = 'sync_gateway_time';
    case RenewCertificate = 'renew_certificate';
}
