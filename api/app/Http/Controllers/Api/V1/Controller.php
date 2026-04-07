<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller as BaseController;
use Symfony\Component\HttpFoundation\Response;

abstract class Controller extends BaseController
{
    protected function authorizeSuperadmin(): void
    {
        $user = request()->user();

        if (! $user || ! $user->is_superadmin) {
            abort(
                response()->json(
                    ['message' => 'This action is only available to superadmin users.'],
                    Response::HTTP_FORBIDDEN
                )
            );
        }
    }
}
