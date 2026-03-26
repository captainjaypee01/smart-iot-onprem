<?php

declare(strict_types=1);

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Support\Facades\DB;

/**
 * Validates that a network_id belongs to at least one of the provided companies
 * via the company_networks pivot.
 */
class NetworkInAnyCompany implements Rule
{
    /**
     * @param int[] $companyIds
     */
    public function __construct(
        private array $companyIds
    ) {}

    /**
     * @param mixed $attribute
     * @param mixed $value
     */
    public function passes($attribute, $value): bool
    {
        if ($this->companyIds === []) {
            return false;
        }

        return DB::table('company_networks')
            ->whereIn('company_id', $this->companyIds)
            ->where('network_id', (int) $value)
            ->exists();
    }

    public function message(): string
    {
        return 'The selected network is not assigned to any of the selected companies.';
    }
}

