<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\UserUpload;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UserUpload>
 */
class UserUploadFactory extends Factory
{
    protected $model = UserUpload::class;

    public function definition(): array
    {
        return [
            'user_id'   => User::factory(),
            'title'     => fake()->sentence(3),
            'author'    => fake()->name(),
            'format'    => fake()->randomElement(['txt', 'epub', 'pdf']),
            'file_hash' => hash('sha256', fake()->unique()->uuid()),
            'file_size' => fake()->numberBetween(1000, 1000000),
        ];
    }
}
