<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Destination;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class DestinationController extends CrudController
{
    protected string $model = Destination::class;
    protected array $searchable = ['name', 'country', 'continent'];
    protected array $filterable = ['continent', 'is_featured', 'is_active'];

    protected function query(Request $request): Builder
    {
        return parent::query($request)->withCount(['packages', 'hotels']);
    }

    protected function rules(Request $request, ?Model $model = null): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'country' => ['required', 'string', 'max:100'],
            'continent' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'string', 'max:500'],
            'best_period' => ['nullable', 'string', 'max:150'],
            'is_featured' => ['boolean'],
            'is_active' => ['boolean'],
        ];
    }
}
