<?php

declare(strict_types=1);

namespace App\Actions\Settings;

use App\DTO\Settings\UpdateSessionSettingsDTO;
use App\Models\Company;
use App\Models\Setting;
use App\Models\User;
use Symfony\Component\HttpFoundation\Response;

class UpdateSessionSettingsAction
{
    /**
     * Update session lifetime for a company. Resolves company from user (superadmin must pass company_id; company admin uses own company). Normalizes value and persists.
     *
     * @return array{session_lifetime_minutes: string, company_id: int|null, message: string}
     */
    public function execute(User $user, UpdateSessionSettingsDTO $dto): array
    {
        $companyId = $this->resolveCompanyId($user, $dto->companyId);

        $value = $this->normalizeSessionLifetime($dto->sessionLifetimeMinutes);
        Setting::set(Setting::KEY_SESSION_LIFETIME, $value, $companyId);

        return [
            'session_lifetime_minutes' => $value,
            'company_id' => $companyId,
            'message' => 'Session duration updated for this company. New logins will use this value.',
        ];
    }

    private function resolveCompanyId(User $user, ?int $requestCompanyId): ?int
    {
        if ($user->is_superadmin) {
            if ($requestCompanyId === null || $requestCompanyId === 0) {
                throw new \Illuminate\Http\Exceptions\HttpResponseException(
                    response()->json(['message' => 'company_id is required when updating as superadmin.'], Response::HTTP_UNPROCESSABLE_ENTITY)
                );
            }
            if (! Company::where('id', $requestCompanyId)->exists()) {
                throw new \Illuminate\Http\Exceptions\HttpResponseException(
                    response()->json(['message' => 'Company not found.'], Response::HTTP_NOT_FOUND)
                );
            }

            return $requestCompanyId;
        }

        $companyId = $user->company_id;
        if ($companyId === null) {
            throw new \Illuminate\Http\Exceptions\HttpResponseException(
                response()->json(['message' => 'Your account has no company.'], Response::HTTP_FORBIDDEN)
            );
        }

        return $companyId;
    }

    private function normalizeSessionLifetime(string $value): string
    {
        $normalized = strtolower(trim($value));
        if ($normalized === 'unlimited' || $normalized === 'forever') {
            return 'unlimited';
        }
        $minutes = (int) $value;

        return $minutes >= 1 ? (string) $minutes : 'unlimited';
    }
}
