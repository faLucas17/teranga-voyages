<?php

namespace App\Services\Payments;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Prestataire de démonstration : le paiement est accepté immédiatement.
 * À utiliser en développement ou pour les démos commerciales.
 */
class SimulationGateway implements PaymentGateway
{
    public function __construct(private readonly PaymentManager $manager) {}

    public function initiate(Payment $payment): Payment
    {
        $payment->update([
            'transaction_ref' => 'SIM-'.Str::upper(Str::random(12)),
            'meta' => ['simulated' => true],
        ]);

        return $this->manager->markSucceeded($payment);
    }

    public function handleWebhook(Request $request): ?Payment
    {
        return null;
    }
}
