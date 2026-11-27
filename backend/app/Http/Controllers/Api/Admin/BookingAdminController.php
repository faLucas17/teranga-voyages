<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\BookingService;
use App\Services\Payments\PaymentManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Gestion des réservations et des paiements par les agents.
 */
class BookingAdminController extends Controller
{
    public function __construct(
        private readonly BookingService $bookings,
        private readonly PaymentManager $payments,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Booking::with(['user:id,name,email,phone', 'bookable', 'payments'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('kind'), fn ($q) => $q->where('bookable_type', $request->string('kind')))
            ->when($request->filled('from'), fn ($q) => $q->whereDate('created_at', '>=', $request->date('from')))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('created_at', '<=', $request->date('to')))
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.$request->string('q').'%';
                $q->where(fn ($w) => $w->whereLike('reference', $term)
                    ->orWhereLike('contact_name', $term)
                    ->orWhereLike('contact_email', $term)
                    ->orWhereLike('contact_phone', $term));
            })
            ->latest();

        return response()->json($query->paginate($this->perPage($request, 15)));
    }

    public function show(Booking $booking): JsonResponse
    {
        return response()->json($booking->load(['user', 'bookable', 'travelers', 'payments', 'coupon']));
    }

    public function update(Request $request, Booking $booking): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', Rule::in(Booking::STATUSES)],
            'admin_notes' => ['nullable', 'string', 'max:5000'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        if (($data['status'] ?? null) === Booking::STATUS_CANCELLED) {
            $booking->cancel($data['reason'] ?? 'Annulée par l\'agence');
            $this->bookings->notify($booking, 'Votre réservation a été annulée');
            unset($data['status']);
        }

        $statusChanged = isset($data['status']) && $data['status'] !== $booking->status;
        $booking->update(collect($data)->only(['status', 'admin_notes'])->all());

        if ($statusChanged) {
            $this->bookings->notify($booking, 'Mise à jour de votre réservation : '.__('statuses.'.$booking->status));
        }

        return response()->json($booking->fresh(['user', 'bookable', 'travelers', 'payments', 'coupon']));
    }

    /** Enregistre un paiement reçu en agence (espèces, virement, Wave manuel...). */
    public function recordPayment(Request $request, Booking $booking): JsonResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'integer', 'min:1', 'max:'.max(1, $booking->balance_due)],
            'method' => ['required', Rule::in(Payment::METHODS)],
            'transaction_ref' => ['nullable', 'string', 'max:100'],
        ]);

        $payment = $booking->payments()->create([
            'user_id' => $booking->user_id,
            'amount' => $data['amount'],
            'currency' => $booking->currency,
            'method' => $data['method'],
            'driver' => 'manual',
            'status' => Payment::STATUS_PENDING,
            'transaction_ref' => $data['transaction_ref'] ?? 'AGT-'.Str::upper(Str::random(10)),
            'meta' => ['recorded_by' => $request->user()->id],
        ]);

        $this->payments->markSucceeded($payment);

        return response()->json($booking->fresh(['user', 'bookable', 'travelers', 'payments', 'coupon']));
    }

    /** Valide un paiement en attente (virement reçu, espèces encaissées). */
    public function confirmPayment(Payment $payment): JsonResponse
    {
        abort_unless($payment->status === Payment::STATUS_PENDING, 422, 'Ce paiement n\'est pas en attente.');

        return response()->json($this->payments->markSucceeded($payment));
    }

    public function payments(Request $request): JsonResponse
    {
        $payments = Payment::with(['booking:id,reference,status', 'user:id,name,email'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('method'), fn ($q) => $q->where('method', $request->string('method')))
            ->when($request->filled('q'), fn ($q) => $q->whereLike('transaction_ref', '%'.$request->string('q').'%'))
            ->latest()
            ->paginate($this->perPage($request, 15));

        return response()->json($payments);
    }

    /** Export CSV des réservations (comptabilité). */
    public function export(Request $request)
    {
        $filename = 'reservations-'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF"); // BOM UTF-8 pour Excel
            fputcsv($out, ['Référence', 'Date', 'Client', 'Email', 'Téléphone', 'Type', 'Offre', 'Départ', 'Adultes', 'Enfants', 'Total', 'Payé', 'Statut'], ';');

            Booking::with(['bookable', 'payments'])->orderBy('id')->chunk(200, function ($bookings) use ($out) {
                foreach ($bookings as $b) {
                    fputcsv($out, [
                        $b->reference,
                        $b->created_at->format('d/m/Y H:i'),
                        $b->contact_name,
                        $b->contact_email,
                        $b->contact_phone,
                        $b->bookable_type,
                        $b->bookable->title ?? $b->bookable->name ?? $b->bookable->label ?? '',
                        $b->start_date?->format('d/m/Y'),
                        $b->adults,
                        $b->children,
                        $b->total,
                        $b->amount_paid,
                        __('statuses.'.$b->status),
                    ], ';');
                }
            });

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
