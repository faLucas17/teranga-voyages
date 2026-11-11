<?php

namespace App\Services\Payments;

use App\Models\Payment;
use Illuminate\Http\Request;

interface PaymentGateway
{
    /**
     * Démarre le paiement. Selon le prestataire, le paiement est soit
     * validé immédiatement, soit en attente avec une URL de redirection (checkout_url).
     */
    public function initiate(Payment $payment): Payment;

    /**
     * Traite la notification (webhook) envoyée par le prestataire.
     * Retourne le paiement concerné, ou null si la notification est ignorée.
     */
    public function handleWebhook(Request $request): ?Payment;
}
