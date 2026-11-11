<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\TravelPackage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PackageController extends CrudController
{
    protected string $model = TravelPackage::class;
    protected array $searchable = ['title', 'summary', 'departure_city'];
    protected array $filterable = ['type', 'destination_id', 'is_featured', 'is_active'];
    protected array $with = ['destination:id,name,country'];

    protected function rules(Request $request, ?Model $model = null): array
    {
        return [
            'destination_id' => ['required', 'exists:destinations,id'],
            'title' => ['required', 'string', 'max:190'],
            'type' => ['required', Rule::in(TravelPackage::TYPES)],
            'summary' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'itinerary' => ['nullable', 'array'],
            'itinerary.*.day' => ['nullable', 'integer'],
            'itinerary.*.title' => ['nullable', 'string', 'max:190'],
            'itinerary.*.description' => ['nullable', 'string'],
            'included' => ['nullable', 'array'],
            'included.*' => ['string', 'max:255'],
            'excluded' => ['nullable', 'array'],
            'excluded.*' => ['string', 'max:255'],
            'gallery' => ['nullable', 'array'],
            'gallery.*' => ['string', 'max:500'],
            'cover_image' => ['nullable', 'string', 'max:500'],
            'duration_days' => ['required', 'integer', 'min:1', 'max:365'],
            'departure_city' => ['nullable', 'string', 'max:100'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'price' => ['required', 'integer', 'min:0'],
            'child_price' => ['nullable', 'integer', 'min:0'],
            'seats_total' => ['required', 'integer', 'min:0'],
            'seats_available' => ['nullable', 'integer', 'min:0'],
            'is_featured' => ['boolean'],
            'is_active' => ['boolean'],
        ];
    }

    protected function prepare(array $data, Request $request, ?Model $model = null): array
    {
        // À la création, toutes les places sont disponibles par défaut
        if (! $model && ! isset($data['seats_available'])) {
            $data['seats_available'] = $data['seats_total'];
        }

        return $data;
    }
}
