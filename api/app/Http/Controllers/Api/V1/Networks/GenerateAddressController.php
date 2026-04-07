<?php

declare(strict_types=1);

// app/Http/Controllers/Api/V1/Networks/GenerateAddressController.php

namespace App\Http\Controllers\Api\V1\Networks;

use App\Actions\Networks\GenerateNetworkAddressAction;
use App\Http\Controllers\Api\V1\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;

final class GenerateAddressController extends Controller
{
    public function __invoke(Request $request, GenerateNetworkAddressAction $action): JsonResponse
    {
        $this->authorizeSuperadmin();

        $name = (string) $request->input('name', '');

        try {
            $address = $action->execute($name);
        } catch (RuntimeException $exception) {
            return response()->json(
                ['message' => $exception->getMessage()],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }

        return response()->json(
            ['data' => ['network_address' => $address]],
            Response::HTTP_OK
        );
    }
}
