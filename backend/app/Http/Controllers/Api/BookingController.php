<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\BookingService;
use App\Services\Payments\PaymentManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Réservations côté client.
 */
class BookingController extends Controller
{
    public function __construct(
        private readonly BookingService $bookings,
        private readonly PaymentManager $payments,
    ) {}

    private function rules(): array
    {
        return [
            'bookable_type' => ['required', Rule::in(array_keys(BookingService::TYPES))],
            'bookable_id' => ['required', 'integer'],
            'adults' => ['required', 'integer', 'min:1', 'max:30'],
            'children' => ['nullable', 'integer', 'min:0', 'max:30'],
            'rooms' => ['nullable', 'integer', 'min:1', 'max:20'],
            'start_date' => ['nullable', 'date', 'after_or_equal:today'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'coupon_code' => ['nullable', 'string', 'max:40'],
        ];
    }

    /** Devis instantané (utilisé par le formulaire de réservation). */
    public function quote(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $item = $this->bookings->resolveItem($data['bookable_type'], (int) $data['bookable_id']);
        $quote = $this->bookings->quote($data['bookable_type'], $item, $data);

        return response()->json([
            ...collect($quote)->except('coupon')->all(),
            'coupon' => $quote['coupon']?->only(['code', 'type', 'value']),
            'currency' => config('agency.currency'),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $bookings = $request->user()->bookings()
            ->with(['bookable', 'payments'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->latest()
            ->paginate($this->perPage($request, 10));

        return response()->json($bookings);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules() + [
            'contact_name' => ['nullable', 'string', 'max:120'],
            'contact_email' => ['nullable', 'email', 'max:190'],
            'contact_phone' => ['nullable', 'string', 'max:30'],
            'special_requests' => ['nullable', 'string', 'max:2000'],
            'travelers' => ['nullable', 'array', 'max:60'],
            'travelers.*.first_name' => ['required_with:travelers', 'string', 'max:80'],
            'travelers.*.last_name' => ['required_with:travelers', 'string', 'max:80'],
            'travelers.*.type' => ['nullable', Rule::in(['adult', 'child'])],
            'travelers.*.birth_date' => ['nullable', 'date', 'before:today'],
            'travelers.*.nationality' => ['nullable', 'string', 'max:100'],
            'travelers.*.passport_number' => ['nullable', 'string', 'max:30'],
            'travelers.*.passport_expiry' => ['nullable', 'date'],
        ]);

        $booking = $this->bookings->create($request->user(), $data);

        return response()->json($booking, 201);
    }

    public function show(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeAccess($request, $booking);

        return response()->json($booking->load(['bookable', 'travelers', 'payments', 'coupon', 'user:id,name,email,phone']));
    }

    public function cancel(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeAccess($request, $booking);

        if (! $booking->isCancellable()) {
            return response()->json(['message' => 'Cette réservation ne peut plus être annulée en ligne. Contactez l\'agence.'], 422);
        }

        $booking->cancel($request->string('reason')->toString() ?: 'Annulée par le client');
        $this->bookings->notify($booking, 'Votre réservation a été annulée');

        return response()->json($booking->fresh(['bookable', 'payments']));
    }

    public function pay(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeAccess($request, $booking);

        $data = $request->validate([
            'method' => ['required', Rule::in(Payment::METHODS)],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        if (! $booking->isPayable()) {
            return response()->json(['message' => 'Cette réservation n\'est pas payable.'], 422);
        }

        $payment = $this->payments->pay($booking, $data['method'], $data['phone'] ?? null);

        return response()->json([
            'payment' => $payment,
            'booking' => $booking->fresh(['bookable', 'payments']),
        ]);
    }

    private function authorizeAccess(Request $request, Booking $booking): void
    {
        $user = $request->user();
        abort_unless($booking->user_id === $user->id || $user->isStaff(), 403, 'Accès refusé.');
    }
}
