<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\NodeType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<NodeType>
 */
class NodeTypeFactory extends Factory
{
    protected $model = NodeType::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->words(2, true),
            'area_id' => strtoupper($this->faker->bothify(str_repeat('#', 6))),
            'description' => $this->faker->optional()->sentence(),
        ];
    }
}

