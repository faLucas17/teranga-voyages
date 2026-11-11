<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Booking $booking, public string $headline) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[{$this->booking->reference}] {$this->headline}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.booking',
            with: [
                'agency' => config('agency.name'),
                'frontendUrl' => rtrim((string) config('app.frontend_url', config('app.url')), '/'),
            ],
        );
    }
}
