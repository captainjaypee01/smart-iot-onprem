<?php

declare(strict_types=1);

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Support\Facades\DB;

class NetworkInCompany implements Rule
{
    public function __construct(
        private int $companyId,
    ) {}

    public function passes($attribute, $value): bool
    {
        return DB::table('company_networks')
            ->where('company_id', $this->companyId)
            ->where('network_id', (int) $value)
            ->exists();
    }

    public function message(): string
    {
        return 'The selected network is not assigned to this company.';
    }
}

