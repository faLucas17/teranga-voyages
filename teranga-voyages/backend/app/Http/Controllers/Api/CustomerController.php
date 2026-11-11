<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Coupon;
use App\Models\NewsletterSubscriber;
use App\Models\Setting;
use App\Models\TravelPackage;
use App\Models\VisaRequest;
use App\Services\Payments\PaymentManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Fonctions "relation client" : favoris, contact, newsletter, visa, codes promo, paramètres publics.
 */
class CustomerController extends Controller
{
    public function favorites(Request $request): JsonResponse
    {
        return response()->json(
            $request->user()->favoritePackages()->with('destination:id,name,slug,country')->latest('favorites.created_at')->get()
        );
    }

    public function toggleFavorite(Request $request, TravelPackage $package): JsonResponse
    {
        $result = $request->user()->favoritePackages()->toggle($package->id);

        return response()->json(['is_favorite' => count($result['attached']) > 0]);
    }

    public function contact(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190'],
            'phone' => ['nullable', 'string', 'max:30'],
            'subject' => ['required', 'string', 'max:190'],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
        ]);

        ContactMessage::create($data);

        return response()->json(['message' => 'Message envoyé. Nous vous répondons sous 24 h.'], 201);
    }

    public function newsletter(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email', 'max:190']]);
        NewsletterSubscriber::firstOrCreate($data);

        return response()->json(['message' => 'Inscription à la newsletter confirmée.'], 201);
    }

    public function storeVisa(Request $request): JsonResponse
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190'],
            'phone' => ['required', 'string', 'max:30'],
            'destination_country' => ['required', 'string', 'max:100'],
            'visa_type' => ['required', Rule::in(VisaRequest::TYPES)],
            'travel_date' => ['nullable', 'date', 'after:today'],
            'passport_number' => ['nullable', 'string', 'max:30'],
            'message' => ['nullable', 'string', 'max:3000'],
        ]);

        $visa = VisaRequest::create($data + ['user_id' => $request->user('sanctum')?->id]);

        return response()->json([
            'message' => 'Demande reçue. Un conseiller vous contactera rapidement.',
            'visa_request' => $visa,
        ], 201);
    }

    public function myVisas(Request $request): JsonResponse
    {
        return response()->json($request->user()->visaRequests()->latest()->get());
    }

    public function checkCoupon(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:40'],
            'amount' => ['required', 'integer', 'min:0'],
        ]);

        $coupon = Coupon::where('code', strtoupper(trim($data['code'])))->first();
        if (! $coupon) {
            return response()->json(['valid' => false, 'message' => 'Code promo inconnu.'], 422);
        }
        if ($error = $coupon->validationError($data['amount'])) {
            return response()->json(['valid' => false, 'message' => $error], 422);
        }

        return response()->json([
            'valid' => true,
            'code' => $coupon->code,
            'discount' => $coupon->discountFor($data['amount']),
            'description' => $coupon->description,
        ]);
    }

    public function settings(): JsonResponse
    {
        return response()->json(array_merge([
            'agency_name' => config('agency.name'),
            'agency_email' => config('agency.email'),
            'agency_phone' => config('agency.phone'),
            'currency' => config('agency.currency'),
            'payment_methods' => config('agency.payments.methods'),
            'payment_mode' => config('agency.payments.default'),
        ], Setting::publicMap()));
    }

    public function paymentWebhook(Request $request, string $provider, PaymentManager $payments): JsonResponse
    {
        abort_unless(in_array($provider, ['wave'], true), 404);

        $payments->gateway($provider)->handleWebhook($request);

        return response()->json(['received' => true]);
    }
}
