<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class Setting extends Model
{
    public const KEY_SESSION_LIFETIME = 'session_lifetime_minutes';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['company_id', 'key', 'value'];

    protected $casts = [
        'company_id' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get a setting value. For the given company, then fallback to global (company_id = null).
     */
    public static function get(string $key, ?int $companyId = null): mixed
    {
        $companyId = $companyId === null ? null : (int) $companyId;

        $row = static::where('key', $key)
            ->where('company_id', $companyId)
            ->first();

        if ($row !== null) {
            return $row->value;
        }

        if ($companyId !== null) {
            $row = static::where('key', $key)->whereNull('company_id')->first();

            return $row !== null ? $row->value : null;
        }

        return null;
    }

    /**
     * Set a setting value for a company (or global when companyId is null).
     * Uses query builder because the table has a composite primary key (company_id, key) and no id column; Eloquent updateOrCreate would use "id" in the WHERE clause.
     */
    public static function set(string $key, mixed $value, ?int $companyId = null): void
    {
        $companyId = $value === null && $companyId === null ? null : ($companyId === null ? null : (int) $companyId);
        $now = now();
        $valueStr = $value === null ? null : (string) $value;

        $updated = DB::table('settings')
            ->where('company_id', $companyId)
            ->where('key', $key)
            ->update(['value' => $valueStr, 'updated_at' => $now]);

        if ($updated === 0) {
            DB::table('settings')->insert([
                'company_id' => $companyId,
                'key' => $key,
                'value' => $valueStr,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    /**
     * Resolve session lifetime in minutes from a stored value (e.g. "120" or "unlimited").
     * Falls back to config when value is null/empty.
     */
    public static function resolveSessionLifetimeMinutes(?string $value): int
    {
        if ($value === null || $value === '') {
            return (int) config('session.lifetime', 120);
        }
        if (in_array(strtolower($value), ['unlimited', 'forever'], true)) {
            return 5256000; // 10 years
        }
        $minutes = (int) $value;

        return $minutes >= 1 ? $minutes : (int) config('session.lifetime', 120);
    }
}
