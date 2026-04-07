<?php

declare(strict_types=1);

// app/Http/Controllers/Api/V1/Companies/UploadCompanyLogoController.php

namespace App\Http\Controllers\Api\V1\Companies;

use App\Actions\Companies\UploadCompanyLogoAction;
use App\Http\Controllers\Api\V1\Controller;
use App\Http\Resources\Api\V1\Companies\CompanyResource;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class UploadCompanyLogoController extends Controller
{
    public function __invoke(
        Request $request,
        Company $company,
        UploadCompanyLogoAction $action,
    ): JsonResponse {
        $authUser = $request->user();

        if (! $authUser->is_superadmin && (int) $authUser->company_id !== (int) $company->id) {
            return response()->json(
                ['message' => 'This action is only available to superadmin or the company admin.'],
                Response::HTTP_FORBIDDEN
            );
        }

        $validated = $request->validate([
            'logo' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],
        ]);

        /** @var \Illuminate\Http\UploadedFile $file */
        $file = $validated['logo'];

        $updated = $action->execute($company, $file);

        return response()->json(
            (new CompanyResource($updated))->toArray($request),
            Response::HTTP_OK
        );
    }
}
