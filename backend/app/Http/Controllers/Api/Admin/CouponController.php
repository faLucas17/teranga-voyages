<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Coupon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CouponController extends CrudController
{
    protected string $model = Coupon::class;
    protected array $searchable = ['code', 'description'];
    protected array $filterable = ['type', 'is_active'];

    protected function rules(Request $request, ?Model $model = null): array
    {
        return [
            'code' => ['required', 'string', 'max:40', Rule::unique('coupons', 'code')->ignore($model?->id)],
            'description' => ['nullable', 'string', 'max:255'],
            'type' => ['required', Rule::in(['percent', 'fixed'])],
            'value' => ['required', 'integer', 'min:1', $request->input('type') === 'percent' ? 'max:100' : 'max:100000000'],
            'min_amount' => ['nullable', 'integer', 'min:0'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'expires_at' => ['nullable', 'date'],
            'is_active' => ['boolean'],
        ];
    }

    protected function prepare(array $data, Request $request, ?Model $model = null): array
    {
        $data['min_amount'] ??= 0;

        return $data;
    }
}
