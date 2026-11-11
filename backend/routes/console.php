<?php

use App\Models\Booking;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

/*
| Maintenance (toutes les heures) :
|  - annule les réservations non payées après le délai configuré (libère les places)
|  - supprime les jetons de connexion expirés
| En local, le conteneur "scheduler" la lance. Sur Render gratuit, un cron externe
| appelle POST /api/cron/run (voir docs/DEPLOIEMENT.md).
*/
Artisan::command('app:maintenance', function () {
    $count = 0;
    Booking::query()
        ->where('status', Booking::STATUS_PENDING)
        ->where('created_at', '<', now()->subHours(config('agency.unpaid_booking_ttl_hours')))
        ->get()
        ->each(function (Booking $booking) use (&$count) {
            $booking->cancel('Annulation automatique : paiement non reçu');
            $count++;
        });

    $this->call('sanctum:prune-expired', ['--hours' => 24]);
    $this->info("Réservations impayées annulées : {$count}");
})->purpose('Tâches de maintenance horaires');

Schedule::command('app:maintenance')->hourly()->withoutOverlapping();

/*
| Installation / mise à jour en une commande (utilisée par Docker au démarrage) :
|   php artisan app:setup          -> migrations + données de démo si base vide
|   php artisan app:setup --fresh  -> remet la base à zéro (ATTENTION : efface tout)
*/
Artisan::command('app:setup {--fresh : Supprime et recrée toutes les tables} {--no-seed : Ne pas insérer les données de démo}', function () {
    if ($this->option('fresh')) {
        $this->call('migrate:fresh', ['--force' => true]);
    } else {
        $this->call('migrate', ['--force' => true]);
    }

    if (\App\Models\User::count() === 0) {
        if (! $this->option('no-seed') && config('agency.seed_demo')) {
            $this->info('Base vide : insertion des données de démonstration...');
            $this->call('db:seed', ['--force' => true]);
        } else {
            $this->warn('Aucun utilisateur. Créez un administrateur : php artisan app:admin votre@email.sn');
        }
    }

    // Les images téléversées sont servies par Nginx (/storage) : pas besoin de "storage:link" avec Docker.

    $this->info('Teranga Voyages est prêt.');
})->purpose('Installe ou met à jour la base de données');

/*
| Création d'un compte administrateur :
|   php artisan app:admin directeur@agence.sn --name="Awa Diallo"
*/
Artisan::command('app:admin {email} {--name=Administrateur}', function (string $email) {
    $password = $this->secret('Mot de passe (8 caractères minimum)');

    if (strlen((string) $password) < 8) {
        $this->error('Mot de passe trop court.');

        return 1;
    }

    \App\Models\User::updateOrCreate(
        ['email' => $email],
        ['name' => $this->option('name'), 'password' => $password, 'role' => 'admin', 'is_active' => true],
    );

    $this->info("Administrateur {$email} prêt.");

    return 0;
})->purpose('Crée ou promeut un compte administrateur');
