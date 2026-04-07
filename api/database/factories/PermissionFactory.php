<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Permission;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Permission>
 */
class PermissionFactory extends Factory
{
    protected $model = Permission::class;

    public function definition(): array
    {
        $module = $this->faker->unique()->word();
        $key = strtolower($module.'.view');

        return [
            'key' => $key,
            'display_name' => $this->faker->sentence(3),
            'module' => $module,
            'description' => $this->faker->optional()->sentence(),
        ];
    }
}
