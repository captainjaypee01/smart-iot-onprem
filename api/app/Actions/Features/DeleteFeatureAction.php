<?php

declare(strict_types=1);

namespace App\Actions\Features;

use App\Models\Feature;

final class DeleteFeatureAction
{
    public function execute(Feature $feature): void
    {
        $feature->delete();
    }
}
