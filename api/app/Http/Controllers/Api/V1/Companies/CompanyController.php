<?php

declare(strict_types=1);

// app/Http/Controllers/Api/V1/Companies/CompanyController.php

namespace App\Http\Controllers\Api\V1\Companies;

use App\Actions\Companies\StoreCompanyAction;
use App\Actions\Companies\UpdateCompanyAction;
use App\DTO\Companies\StoreCompanyDTO;
use App\DTO\Companies\UpdateCompanyDTO;
use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Api\V1\Companies\StoreCompanyRequest;
use App\Http\Requests\Api\V1\Companies\UpdateCompanyRequest;
use App\Http\Resources\Api\V1\Companies\CompanyResource;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class CompanyController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorizeSuperadmin();

        $query = Company::query()->with('networks');

        if ($search = (string) $request->query('search', '')) {
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('code', 'like', '%' . $search . '%');
            });
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', (bool) $request->query('is_active'));
        }

        if ($request->filled('is_demo')) {
            $query->where('is_demo', (bool) $request->query('is_demo'));
        }

        $perPage = (int) $request->query('per_page', 15);
        $perPage = max(1, min($perPage, 100));

        $companies = $query
            ->orderBy('name')
            ->withCount('users')
            ->paginate($perPage);

        return CompanyResource::collection($companies);
    }

    public function show(Request $request, Company $company): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser->is_superadmin && (int) $authUser->company_id !== (int) $company->id) {
            return response()->json(
                ['message' => 'This action is only available to superadmin or the company admin.'],
                Response::HTTP_FORBIDDEN
            );
        }

        $company->load('networks');

        return response()->json(
            (new CompanyResource($company))->toArray($request),
            Response::HTTP_OK
        );
    }

    public function store(
        StoreCompanyRequest $request,
        StoreCompanyAction $action,
    ): JsonResponse {
        $validated = $request->validated();

        $dto = new StoreCompanyDTO(
            name: $validated['name'],
            code: $validated['code'],
            address: $validated['address'] ?? null,
            contactEmail: $validated['contact_email'] ?? null,
            contactPhone: $validated['contact_phone'] ?? null,
            timezone: $validated['timezone'],
            loginAttempts: $validated['login_attempts'] ?? 5,
            is2faEnforced: $validated['is_2fa_enforced'] ?? false,
            isDemo: $validated['is_demo'] ?? false,
            isActiveZone: $validated['is_active_zone'] ?? true,
            isActive: $validated['is_active'] ?? true,
            customAlarmThreshold: $validated['custom_alarm_threshold'] ?? null,
            customAlarmThresholdUnit: isset($validated['custom_alarm_threshold_unit'])
                ? $validated['custom_alarm_threshold_unit']
                : null,
            networkIds: $validated['network_ids'] ?? [],
        );

        $company = $action->execute($dto);

        return response()->json(
            (new CompanyResource($company))->toArray($request),
            Response::HTTP_CREATED
        );
    }

    public function update(
        UpdateCompanyRequest $request,
        Company $company,
        UpdateCompanyAction $action,
    ): JsonResponse {
        $validated = $request->validated();

        $dto = new UpdateCompanyDTO(
            name: $validated['name'] ?? null,
            code: $validated['code'] ?? null,
            address: $validated['address'] ?? null,
            contactEmail: $validated['contact_email'] ?? null,
            contactPhone: $validated['contact_phone'] ?? null,
            timezone: $validated['timezone'] ?? null,
            loginAttempts: $validated['login_attempts'] ?? null,
            is2faEnforced: $validated['is_2fa_enforced'] ?? null,
            isDemo: $validated['is_demo'] ?? null,
            isActiveZone: $validated['is_active_zone'] ?? null,
            isActive: $validated['is_active'] ?? null,
            customAlarmThreshold: $validated['custom_alarm_threshold'] ?? null,
            customAlarmThresholdUnit: $validated['custom_alarm_threshold_unit'] ?? null,
            networkIds: $validated['network_ids'] ?? null,
        );

        $updated = $action->execute($company, $dto);

        return response()->json(
            (new CompanyResource($updated))->toArray($request),
            Response::HTTP_OK
        );
    }

    public function destroy(Company $company): JsonResponse
    {
        $this->authorizeSuperadmin();

        if ($company->users()->exists()) {
            return response()->json(
                ['message' => 'Company has active users and cannot be deleted.'],
                Response::HTTP_CONFLICT
            );
        }

        $company->delete();

        return response()->json([], Response::HTTP_NO_CONTENT);
    }

    public function options(Request $request): JsonResponse
    {
        $authUser = $request->user();

        $query = Company::query()
            ->where('is_active', true)
            ->orderBy('name');

        if (! $authUser->is_superadmin && $authUser->company_id !== null) {
            $query->where('id', $authUser->company_id);
        }

        $companies = $query->get(['id', 'name', 'code']);

        $data = $companies->map(static fn (Company $company): array => [
            'id' => $company->id,
            'name' => $company->name,
            'code' => $company->code,
        ])->all();

        return response()->json(['data' => $data]);
    }
}

