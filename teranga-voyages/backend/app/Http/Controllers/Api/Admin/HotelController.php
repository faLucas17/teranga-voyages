<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Hotel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class HotelController extends CrudController
{
    protected string $model = Hotel::class;
    protected array $searchable = ['name', 'address'];
    protected array $filterable = ['destination_id', 'stars', 'is_active'];
    protected array $with = ['destination:id,name,country'];

    protected function rules(Request $request, ?Model $model = null): array
    {
        return [
            'destination_id' => ['required', 'exists:destinations,id'],
            'name' => ['required', 'string', 'max:190'],
            'stars' => ['required', 'integer', 'between:1,5'],
            'address' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'amenities' => ['nullable', 'array'],
            'amenities.*' => ['string', 'max:100'],
            'image' => ['nullable', 'string', 'max:500'],
            'price_per_night' => ['required', 'integer', 'min:0'],
            'rooms_available' => ['required', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }
}
