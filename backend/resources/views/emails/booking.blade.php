<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><title>{{ $headline }}</title></head>
<body style="margin:0;background:#F4F8FD;font-family:Arial,Helvetica,sans-serif;color:#0F172A">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0">
    <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden">
            <tr>
                <td style="background:#0039A6;padding:24px 32px;color:#ffffff">
                    <div style="font-size:22px;font-weight:bold">{{ $agency }}</div>
                    <div style="font-size:13px;color:#BEE3F8;letter-spacing:2px">VOYAGES</div>
                </td>
            </tr>
            <tr>
                <td style="padding:32px">
                    <h1 style="font-size:20px;color:#0039A6;margin:0 0 12px">{{ $headline }}</h1>
                    <p>Bonjour {{ $booking->contact_name ?? $booking->user->name }},</p>
                    <p>Voici le récapitulatif de votre réservation :</p>
                    <table width="100%" cellpadding="8" style="border-collapse:collapse;background:#E6F4FD;border-radius:8px">
                        <tr><td><strong>Référence</strong></td><td>{{ $booking->reference }}</td></tr>
                        <tr><td><strong>Offre</strong></td><td>{{ $booking->bookable->title ?? $booking->bookable->name ?? $booking->bookable->label ?? '-' }}</td></tr>
                        @if($booking->start_date)
                        <tr><td><strong>Dates</strong></td><td>{{ $booking->start_date->format('d/m/Y') }}@if($booking->end_date) → {{ $booking->end_date->format('d/m/Y') }}@endif</td></tr>
                        @endif
                        <tr><td><strong>Voyageurs</strong></td><td>{{ $booking->adults }} adulte(s), {{ $booking->children }} enfant(s)</td></tr>
                        <tr><td><strong>Total</strong></td><td>{{ number_format($booking->total, 0, ',', ' ') }} {{ $booking->currency }}</td></tr>
                        <tr><td><strong>Statut</strong></td><td>{{ __('statuses.'.$booking->status) }}</td></tr>
                    </table>
                    <p style="margin-top:24px">
                        <a href="{{ $frontendUrl }}/compte/reservations/{{ $booking->id }}"
                           style="background:#0039A6;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">
                            Voir ma réservation
                        </a>
                    </p>
                    <p style="color:#64748B;font-size:13px">Merci de votre confiance. L'équipe {{ $agency }}.</p>
                </td>
            </tr>
        </table>
    </td></tr>
</table>
</body>
</html>
