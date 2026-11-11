<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Flight;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FlightController extends CrudController
{
    protected string $model = Flight::class;
    protected array $searchable = ['airline', 'flight_number', 'from_city', 'to_city', 'from_code', 'to_code'];
    protected array $filterable = ['cabin_class', 'is_active'];
    protected string $defaultSort = 'departure_at';

    protected function rules(Request $request, ?Model $model = null): array
    {
        return [
            'airline' => ['required', 'string', 'max:100'],
            'flight_number' => ['required', 'string', 'max:20'],
            'from_city' => ['required', 'string', 'max:100'],
            'from_code' => ['required', 'string', 'size:3'],
            'to_city' => ['required', 'string', 'max:100'],
            'to_code' => ['required', 'string', 'size:3'],
            'departure_at' => ['required', 'date'],
            'arrival_at' => ['required', 'date', 'after:departure_at'],
            'cabin_class' => ['required', Rule::in(Flight::CLASSES)],
            'price' => ['required', 'integer', 'min:0'],
            'seats_available' => ['required', 'integer', 'min:0'],
            'baggage' => ['nullable', 'string', 'max:190'],
            'is_active' => ['boolean'],
        ];
    }

    protected function prepare(array $data, Request $request, ?Model $model = null): array
    {
        $data['from_code'] = strtoupper($data['from_code']);
        $data['to_code'] = strtoupper($data['to_code']);

        return $data;
    }
}
