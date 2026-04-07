<?php

// app/Actions/Companies/UploadCompanyLogoAction.php

declare(strict_types=1);

namespace App\Actions\Companies;

use App\Models\Company;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

final class UploadCompanyLogoAction
{
    public function execute(Company $company, UploadedFile $file): Company
    {
        if ($company->logo_path !== null) {
            Storage::disk()->delete($company->logo_path);
        }

        $path = Storage::disk()->put('logos', $file);

        $company->logo_path = $path;
        $company->save();

        return $company;
    }
}
