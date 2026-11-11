<?php

namespace App\Mail\Transport;

use Illuminate\Support\Facades\Http;
use RuntimeException;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\MessageConverter;

/**
 * Envoi des e-mails via l'API HTTP de Brevo (https://api.brevo.com/v3/smtp/email).
 *
 * Pourquoi l'API et pas le SMTP ? Les services gratuits de Render bloquent les ports
 * SMTP sortants (25, 465, 587) : seul l'envoi par HTTPS fonctionne.
 *
 * Activation : MAIL_MAILER=brevo et BREVO_API_KEY=xkeysib-... dans les variables d'environnement.
 */
class BrevoApiTransport extends AbstractTransport
{
    public function __construct(private readonly string $apiKey)
    {
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());
        $envelope = $message->getEnvelope();

        $map = fn (array $addresses) => array_map(
            fn (Address $a) => array_filter(['email' => $a->getAddress(), 'name' => $a->getName() ?: null]),
            $addresses
        );

        $sender = $envelope->getSender();
        $replyTo = $email->getReplyTo()[0] ?? null;

        $payload = array_filter([
            'sender' => array_filter(['email' => $sender->getAddress(), 'name' => $sender->getName() ?: null]),
            'to' => $map($email->getTo()),
            'cc' => $map($email->getCc()) ?: null,
            'bcc' => $map($email->getBcc()) ?: null,
            'replyTo' => $replyTo ? array_filter(['email' => $replyTo->getAddress(), 'name' => $replyTo->getName() ?: null]) : null,
            'subject' => $email->getSubject() ?? '',
            'htmlContent' => $email->getHtmlBody() ?: nl2br(e((string) $email->getTextBody())),
            'textContent' => $email->getTextBody() ?: null,
            'attachment' => array_map(fn ($part) => [
                'name' => $part->getFilename() ?? 'piece-jointe',
                'content' => base64_encode($part->getBody()),
            ], $email->getAttachments()) ?: null,
        ], fn ($value) => $value !== null);

        $response = Http::withHeaders(['api-key' => $this->apiKey])
            ->acceptJson()
            ->timeout(15)
            ->post('https://api.brevo.com/v3/smtp/email', $payload);

        if ($response->failed()) {
            throw new RuntimeException('Brevo a refusé l\'e-mail ('.$response->status().') : '.$response->body());
        }

        if ($id = $response->json('messageId')) {
            $message->setMessageId((string) $id);
        }
    }

    public function __toString(): string
    {
        return 'brevo+api://api.brevo.com';
    }
}
