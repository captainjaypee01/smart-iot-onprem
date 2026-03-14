<?php

declare(strict_types=1);

namespace App\Actions\Settings;

use App\Models\Company;
use App\Models\Setting;
use App\Models\User;
use Symfony\Component\HttpFoundation\Response;

class GetSessionSettingsAction
{
    /**
     * Get session settings for the authenticated user's context.
     * Superadmin: can pass requestedCompanyId (query); gets companies list and selected company's settings.
     * Company admin: gets their own company's settings only.
     *
     * @return array{session_lifetime_minutes: string, effective_minutes: int, companies?: array<int, array{id: int, name: string, code: string}>, company_id?: int|null}
     */
    public function execute(User $user, ?int $requestedCompanyId = null): array
    {
        $companyId = null;
        $companies = null;

        if ($user->is_superadmin) {
            $companies = Company::orderBy('name')->get(['id', 'name', 'code']);
            if ($requestedCompanyId !== null && $requestedCompanyId !== 0) {
                if (! $companies->contains('id', $requestedCompanyId)) {
                    throw new \Illuminate\Http\Exceptions\HttpResponseException(
                        response()->json(['message' => 'Company not found.'], Response::HTTP_NOT_FOUND)
                    );
                }
                $companyId = $requestedCompanyId;
            } else {
                $first = $companies->first();
                $companyId = $first?->id;
            }
        } else {
            $companyId = $user->company_id;
            if ($companyId === null) {
                return $this->defaultPayload(null, null);
            }
        }

        $stored = Setting::get(Setting::KEY_SESSION_LIFETIME, $companyId);
        $effective = Setting::resolveSessionLifetimeMinutes($stored);
        $payload = [
            'session_lifetime_minutes' => $stored ?? (string) config('session.lifetime'),
            'effective_minutes' => $effective,
        ];

        if ($companies !== null) {
            $payload['companies'] = $companies->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'code' => $c->code,
            ])->values()->all();
            $payload['company_id'] = $companyId;
        }

        return $payload;
    }

    /**
     * @return array{session_lifetime_minutes: string, effective_minutes: int, companies: array, company_id: null}
     */
    private function defaultPayload(?array $companies, ?int $companyId): array
    {
        $effective = (int) config('session.lifetime');
        $payload = [
            'companies' => $companies ?? [],
            'company_id' => $companyId,
            'session_lifetime_minutes' => (string) config('session.lifetime'),
            'effective_minutes' => $effective,
        ];

        return $payload;
    }
}
