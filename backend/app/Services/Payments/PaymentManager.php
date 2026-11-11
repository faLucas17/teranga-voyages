<?php

namespace App\Services\Payments;

use App\Models\Booking;
use App\Models\Payment;
use App\Services\BookingService;
use Illuminate\Support\Facades\DB;

/**
 * Point d'entrée unique des paiements : choisit le bon prestataire
 * et met à jour la réservation quand un paiement aboutit.
 */
class PaymentManager
{
    /**
     * Choix du prestataire selon la méthode et la configuration.
     *  - PAYMENT_DEFAULT_DRIVER=simulation : tout est simulé (sauf espèces/virement)
     *  - PAYMENT_DEFAULT_DRIVER=live       : Wave réel si configuré, sinon simulation
     */
    public function driverNameFor(string $method): string
    {
        if (in_array($method, ['cash', 'bank_transfer'], true)) {
            return 'manual';
        }

        if (config('agency.payments.default') === 'simulation') {
            return 'simulation';
        }

        if ($method === 'wave' && config('agency.payments.wave.api_key')) {
            return 'wave';
        }

        // Orange Money / carte : à brancher (voir docs/PAIEMENTS.md)
        return 'simulation';
    }

    public function gateway(string $driver): PaymentGateway
    {
        return match ($driver) {
            'wave' => new WaveGateway($this),
            'manual' => new ManualGateway,
            default => new SimulationGateway($this),
        };
    }

    public function pay(Booking $booking, string $method, ?string $phone = null): Payment
    {
        $driver = $this->driverNameFor($method);

        $payment = $booking->payments()->create([
            'user_id' => $booking->user_id,
            'amount' => $booking->balance_due,
            'currency' => $booking->currency,
            'method' => $method,
            'driver' => $driver,
            'status' => Payment::STATUS_PENDING,
            'phone' => $phone,
        ]);

        return $this->gateway($driver)->initiate($payment);
    }

    public function markSucceeded(Payment $payment): Payment
    {
        if ($payment->status === Payment::STATUS_SUCCEEDED) {
            return $payment;
        }

        DB::transaction(function () use ($payment) {
            $payment->update(['status' => Payment::STATUS_SUCCEEDED, 'paid_at' => now()]);

            $booking = $payment->booking()->first();
            if ($booking->balance_due === 0 && $booking->status !== Booking::STATUS_CANCELLED) {
                $booking->update(['status' => Booking::STATUS_PAID]);
            }
        });

        $booking = $payment->booking()->first();
        app(BookingService::class)->notify($booking, 'Paiement reçu - merci !');

        return $payment->fresh();
    }

    public function markFailed(Payment $payment): Payment
    {
        $payment->update(['status' => Payment::STATUS_FAILED]);

        return $payment->fresh();
    }
}
