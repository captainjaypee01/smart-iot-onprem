<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Provisioning;

use App\Actions\Provisioning\ResendProvisioningNodeAction;
use App\Enums\ProvisioningNodeStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ProvisioningBatchNodeResource;
use App\Models\ProvisioningBatch;
use App\Models\ProvisioningBatchNode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResendProvisioningNodeController extends Controller
{
    public function __invoke(
        Request $request,
        ProvisioningBatch $provisioningBatch,
        ProvisioningBatchNode $provisioningBatchNode,
        ResendProvisioningNodeAction $action,
    ): ProvisioningBatchNodeResource|JsonResponse {
        if (! $request->user()?->is_superadmin) {
            return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
        }

        if ((int) $provisioningBatchNode->provisioning_batch_id !== (int) $provisioningBatch->id) {
            return response()->json(['message' => 'Not found.'], Response::HTTP_NOT_FOUND);
        }

        if ($provisioningBatchNode->status === ProvisioningNodeStatus::Provisioned) {
            return response()->json(
                ['message' => 'Node has already been provisioned and cannot be resent.'],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        $node = $action->execute($provisioningBatch, $provisioningBatchNode);

        return new ProvisioningBatchNodeResource($node);
    }
}
