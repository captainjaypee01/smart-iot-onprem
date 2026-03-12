<?php

// app/Models/Company.php
// Eloquent model for the companies table.

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'address',
        'contact_email',
        'contact_phone',
        'is_active',
    ];

    /**
     * Users that belong to this company.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}

