<?php

namespace App\Providers;

use App\Mail\Transport\BrevoApiTransport;
use App\Models\Flight;
use App\Models\Hotel;
use App\Models\TravelPackage;
use App\Models\User;
use App\Services\Payments\PaymentManager;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PaymentManager::class);
    }

    public function boot(): void
    {
        // Noms courts et stables pour les relations polymorphes (bookable_type)
        Relation::enforceMorphMap([
            'package' => TravelPackage::class,
            'hotel' => Hotel::class,
            'flight' => Flight::class,
            'user' => User::class,
        ]);

        JsonResource::withoutWrapping();

        // En production (Render), toutes les URL générées sont en HTTPS
        if ($this->app->isProduction()) {
            URL::forceScheme('https');
        }

        // Transport e-mail Brevo par API HTTP (le SMTP est bloqué sur Render gratuit)
        Mail::extend('brevo', fn (array $config) => new BrevoApiTransport((string) ($config['key'] ?? '')));

        // Lien de réinitialisation du mot de passe : il pointe vers le frontend React
        ResetPassword::createUrlUsing(fn ($user, string $token) => rtrim((string) config('app.frontend_url'), '/')
            .'/reinitialiser-mot-de-passe?token='.$token.'&email='.urlencode($user->getEmailForPasswordReset()));

        ResetPassword::toMailUsing(fn ($user, string $token) => (new MailMessage)
            ->subject('Réinitialisation de votre mot de passe')
            ->greeting('Bonjour '.$user->name.',')
            ->line('Vous avez demandé à réinitialiser le mot de passe de votre compte '.config('agency.name').'.')
            ->action('Choisir un nouveau mot de passe', rtrim((string) config('app.frontend_url'), '/')
                .'/reinitialiser-mot-de-passe?token='.$token.'&email='.urlencode($user->getEmailForPasswordReset()))
            ->line('Ce lien expire dans 60 minutes.')
            ->line('Si vous n\'êtes pas à l\'origine de cette demande, ignorez simplement cet e-mail.')
            ->salutation('L\'équipe '.config('agency.name')));

        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(120)->by($request->user()?->id ?: $request->ip()));
        RateLimiter::for('auth', fn (Request $request) => Limit::perMinute(10)->by($request->ip()));
        RateLimiter::for('forms', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));
    }
}
