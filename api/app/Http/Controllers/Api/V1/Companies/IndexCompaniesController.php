<?php

declare(strict_types=1);

// app/Http/Controllers/Api/V1/Companies/IndexCompaniesController.php
// GET /api/v1/companies/options — list companies for user-create dropdown (not paginated).

namespace App\Http\Controllers\Api\V1\Companies;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IndexCompaniesController extends Controller
{
    /**
     * Superadmin: all active companies. Company admin: only their own company.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $authUser = $request->user();

        $query = Company::query()
            ->where('is_active', true)
            ->orderBy('name');

        if (! $authUser->is_superadmin && $authUser->company_id !== null) {
            $query->where('id', $authUser->company_id);
        }

        $companies = $query->get(['id', 'name', 'code']);

        return response()->json([
            'data' => $companies->map(static fn (Company $company): array => [
                'id' => $company->id,
                'name' => $company->name,
                'code' => $company->code,
            ]),
        ]);
    }
}

