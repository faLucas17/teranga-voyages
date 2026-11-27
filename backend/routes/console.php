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

/*
| Copie de toutes les données vers une autre base (ex. : MySQL local -> Neon PostgreSQL).
|   docker compose exec backend php artisan app:copy-database "postgresql://user:mdp@hote/base?sslmode=require"
| La base cible est d'abord migrée, puis VIDÉE, puis remplie avec les données de la base actuelle.
*/
Artisan::command('app:copy-database {target : URL de la base cible, ex. postgresql://...} {--force : Ne pas demander de confirmation}', function (string $target) {
    $base = str_starts_with($target, 'mysql') ? config('database.connections.mysql') : config('database.connections.pgsql');
    config(['database.connections.copy_target' => array_merge($base, ['url' => $target])]);

    $source = \Illuminate\Support\Facades\DB::connection();
    $dest = \Illuminate\Support\Facades\DB::connection('copy_target');

    try {
        $dest->getPdo();
    } catch (\Throwable $e) {
        $this->error('Connexion impossible à la base cible : '.$e->getMessage());

        return 1;
    }

    $this->warn('Source : '.$source->getDriverName().' / '.$source->getDatabaseName());
    $this->warn('Cible  : '.$dest->getDriverName().' / '.$dest->getDatabaseName());
    if (! $this->option('force') && ! $this->confirm('Toutes les données de la base CIBLE seront remplacées. Continuer ?')) {
        return 1;
    }

    $this->info('1/3 Création des tables sur la cible...');
    $this->call('migrate', ['--database' => 'copy_target', '--force' => true]);

    // Ordre compatible avec les clés étrangères
    $tables = [
        'users', 'destinations', 'travel_packages', 'hotels', 'flights', 'coupons',
        'bookings', 'travelers', 'payments', 'reviews', 'favorites',
        'visa_requests', 'contact_messages', 'newsletter_subscribers', 'settings',
    ];
    $tables = array_values(array_filter($tables, fn ($t) => \Illuminate\Support\Facades\Schema::connection(null)->hasTable($t)));

    $this->info('2/3 Vidage de la cible...');
    if ($dest->getDriverName() === 'pgsql') {
        $dest->statement('TRUNCATE TABLE '.implode(', ', array_map(fn ($t) => '"'.$t.'"', $tables)).' RESTART IDENTITY CASCADE');
    } else {
        $dest->statement('SET FOREIGN_KEY_CHECKS=0');
        foreach (array_reverse($tables) as $t) {
            $dest->table($t)->truncate();
        }
        $dest->statement('SET FOREIGN_KEY_CHECKS=1');
    }

    $this->info('3/3 Copie des données...');
    foreach ($tables as $table) {
        // Colonnes booléennes de la cible : MySQL renvoie 0/1, PostgreSQL attend true/false
        $columns = \Illuminate\Support\Facades\Schema::connection('copy_target')->getColumns($table);
        $booleans = collect($columns)->filter(fn ($c) => in_array(strtolower($c['type_name']), ['bool', 'boolean'], true))->pluck('name')->all();
        $targetColumns = collect($columns)->pluck('name')->all();

        $count = 0;
        $source->table($table)->orderBy('id')->chunk(200, function ($rows) use ($dest, $table, $booleans, $targetColumns, &$count) {
            $data = $rows->map(function ($row) use ($booleans, $targetColumns) {
                $row = array_intersect_key((array) $row, array_flip($targetColumns));
                foreach ($booleans as $b) {
                    if (array_key_exists($b, $row) && $row[$b] !== null) {
                        $row[$b] = (bool) $row[$b];
                    }
                }

                return $row;
            })->all();
            $dest->table($table)->insert($data);
            $count += count($data);
        });

        // Les identifiants auto-incrémentés repartent après le plus grand id copié
        if ($dest->getDriverName() === 'pgsql') {
            $dest->statement("SELECT setval(pg_get_serial_sequence('\"{$table}\"', 'id'), COALESCE((SELECT MAX(id) FROM \"{$table}\"), 1), (SELECT COUNT(*) FROM \"{$table}\") > 0)");
        }

        $this->line(sprintf('  %-24s %6d ligne(s)', $table, $count));
    }

    $this->info('Copie terminée. Les utilisateurs devront se reconnecter.');

    return 0;
})->purpose('Copie toutes les données vers une autre base (ex. MySQL local vers Neon)');
