<?php

namespace App\Services\Payments;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Intégration Wave Checkout (Sénégal / Côte d'Ivoire).
 *
 * Pour l'activer : créez un compte Wave Business, récupérez la clé API et le
 * secret de webhook, puis renseignez WAVE_API_KEY / WAVE_WEBHOOK_SECRET et
 * PAYMENT_DEFAULT_DRIVER=live dans le fichier .env.
 * Vérifiez les champs exacts dans la documentation officielle Wave avant la mise en production.
 */
class WaveGateway implements PaymentGateway
{
    public function __construct(private readonly PaymentManager $manager) {}

    public function initiate(Payment $payment): Payment
    {
        $config = config('agency.payments.wave');
        if (empty($config['api_key'])) {
            throw new RuntimeException('Wave n\'est pas configuré (WAVE_API_KEY manquant).');
        }

        $frontend = rtrim((string) config('app.frontend_url', config('app.url')), '/');
        $bookingUrl = $frontend.'/compte/reservations/'.$payment->booking_id;

        $response = Http::withToken($config['api_key'])
            ->acceptJson()
            ->post($config['base_url'].'/checkout/sessions', [
                'amount' => (string) $payment->amount,
                'currency' => $payment->currency,
                'client_reference' => (string) $payment->id,
                'success_url' => $bookingUrl.'?paiement=succes',
                'error_url' => $bookingUrl.'?paiement=echec',
            ])
            ->throw()
            ->json();

        $payment->update([
            'transaction_ref' => $response['id'] ?? null,
            'checkout_url' => $response['wave_launch_url'] ?? null,
            'meta' => ['wave' => $response],
        ]);

        return $payment->fresh();
    }

    public function handleWebhook(Request $request): ?Payment
    {
        // Sécurité : sans secret configuré, on refuse TOUS les webhooks.
        // Sinon n'importe qui pourrait marquer une réservation comme payée.
        $secret = config('agency.payments.wave.webhook_secret');
        if (! $secret) {
            abort(503, 'Webhook Wave non configuré (WAVE_WEBHOOK_SECRET manquant).');
        }

        // Wave signe ses webhooks : vérifiez le format de l'en-tête "Wave-Signature" dans la doc officielle.
        $signature = (string) $request->header('Wave-Signature');
        if (! $this->signatureIsValid($signature, $request->getContent(), $secret)) {
            abort(401, 'Signature Wave invalide.');
        }

        $event = $request->input('type');
        $data = $request->input('data', []);
        $payment = Payment::find($data['client_reference'] ?? null);

        if (! $payment) {
            return null;
        }

        return match ($event) {
            'checkout.session.completed' => $this->manager->markSucceeded($payment),
            'checkout.session.payment_failed' => $this->manager->markFailed($payment),
            default => $payment,
        };
    }

    private function signatureIsValid(string $header, string $body, string $secret): bool
    {
        // Format attendu : "t=TIMESTAMP,v1=SIGNATURE"
        $parts = [];
        foreach (explode(',', $header) as $part) {
            [$k, $v] = array_pad(explode('=', $part, 2), 2, null);
            $parts[$k][] = $v;
        }
        $timestamp = $parts['t'][0] ?? '';
        $expected = hash_hmac('sha256', $timestamp.$body, $secret);

        foreach ($parts['v1'] ?? [] as $candidate) {
            if (hash_equals($expected, (string) $candidate)) {
                return true;
            }
        }

        return false;
    }
}
