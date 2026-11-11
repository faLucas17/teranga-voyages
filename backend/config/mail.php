<?php

/*
| Configuration des e-mails (complète celle de Laravel 12).
| En production : MAIL_MAILER=brevo + BREVO_API_KEY.
| En local (Docker) : MAIL_MAILER=smtp vers Mailpit.
*/

return [
    'default' => env('MAIL_MAILER', 'log'),

    'mailers' => [
        'smtp' => [
            'transport' => 'smtp',
            'scheme' => env('MAIL_SCHEME'),
            'url' => env('MAIL_URL'),
            'host' => env('MAIL_HOST', '127.0.0.1'),
            'port' => env('MAIL_PORT', 2525),
            'username' => env('MAIL_USERNAME'),
            'password' => env('MAIL_PASSWORD'),
            'timeout' => null,
            'local_domain' => env('MAIL_EHLO_DOMAIN', parse_url((string) env('APP_URL', 'http://localhost'), PHP_URL_HOST)),
        ],

        // Transport HTTP Brevo (voir App\Mail\Transport\BrevoApiTransport)
        'brevo' => [
            'transport' => 'brevo',
            'key' => env('BREVO_API_KEY'),
        ],

        'log' => [
            'transport' => 'log',
            'channel' => env('MAIL_LOG_CHANNEL'),
        ],

        'array' => [
            'transport' => 'array',
        ],
    ],

    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'reservations@teranga-voyages.sn'),
        'name' => env('MAIL_FROM_NAME', env('APP_NAME', 'Teranga Voyages')),
    ],
];
