<?php

namespace App\Services\Payments;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Paiement en agence (espèces) ou par virement bancaire :
 * le paiement reste "pending" jusqu'à validation par un agent dans le back-office.
 */
class ManualGateway implements PaymentGateway
{
    public function initiate(Payment $payment): Payment
    {
        $payment->update([
            'transaction_ref' => 'MAN-'.Str::upper(Str::random(10)),
            'meta' => [
                'instructions' => $payment->method === 'bank_transfer'
                    ? 'Effectuez le virement en indiquant la référence de réservation. Le paiement sera validé à réception.'
                    : 'Présentez-vous en agence avec votre référence de réservation pour régler en espèces.',
            ],
        ]);

        return $payment->fresh();
    }

    public function handleWebhook(Request $request): ?Payment
    {
        return null;
    }
}
