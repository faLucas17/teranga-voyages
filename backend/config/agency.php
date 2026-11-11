<?php

/*
|--------------------------------------------------------------------------
| Configuration de l'agence (marque blanche)
|--------------------------------------------------------------------------
| Toutes les informations propres à l'agence sont ici et dans la table
| "settings" (modifiable depuis le back-office). Pour revendre l'application
| à une autre agence, il suffit de changer ces valeurs dans le fichier .env.
*/

return [
    'name' => env('AGENCY_NAME', 'Teranga Voyages'),
    'email' => env('AGENCY_EMAIL', 'contact@teranga-voyages.sn'),
    'phone' => env('AGENCY_PHONE', '+221 33 800 00 00'),
    'currency' => env('AGENCY_CURRENCY', 'XOF'),
    'booking_prefix' => env('BOOKING_PREFIX', 'TV'),

    // Insérer les données de démonstration au premier démarrage (mettre false en production)
    'seed_demo' => (bool) env('SEED_DEMO', true),

    // Secret partagé pour l'URL de maintenance appelée par un cron externe (POST /api/cron/run)
    'cron_secret' => env('CRON_SECRET', ''),

    // Réduction appliquée au tarif enfant pour les vols (0.75 = -25 %)
    'flight_child_ratio' => 0.75,

    // Délai (en heures) après lequel une réservation non payée peut être annulée
    'unpaid_booking_ttl_hours' => 48,

    'payments' => [
        'default' => env('PAYMENT_DEFAULT_DRIVER', 'simulation'),

        // Méthodes proposées au client
        'methods' => ['wave', 'orange_money', 'card', 'bank_transfer', 'cash'],

        'wave' => [
            'api_key' => env('WAVE_API_KEY'),
            'webhook_secret' => env('WAVE_WEBHOOK_SECRET'),
            'base_url' => 'https://api.wave.com/v1',
        ],
        'orange_money' => [
            'client_id' => env('ORANGE_MONEY_CLIENT_ID'),
            'client_secret' => env('ORANGE_MONEY_CLIENT_SECRET'),
            'merchant_key' => env('ORANGE_MONEY_MERCHANT_KEY'),
        ],
        'stripe' => [
            'secret' => env('STRIPE_SECRET'),
            'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
        ],
    ],
];
