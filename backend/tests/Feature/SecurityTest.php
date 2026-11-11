<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_mot_de_passe_oublie_puis_reinitialisation(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'awa@example.com']);

        $this->postJson('/api/auth/forgot-password', ['email' => 'awa@example.com'])->assertOk();

        $token = null;
        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use (&$token) {
            $token = $notification->token;

            return true;
        });

        $this->postJson('/api/auth/reset-password', [
            'token' => $token,
            'email' => 'awa@example.com',
            'password' => 'nouveau-mdp-2026',
            'password_confirmation' => 'nouveau-mdp-2026',
        ])->assertOk();

        $this->postJson('/api/auth/login', ['email' => 'awa@example.com', 'password' => 'nouveau-mdp-2026'])->assertOk();
    }

    public function test_email_inconnu_meme_reponse(): void
    {
        $this->postJson('/api/auth/forgot-password', ['email' => 'inconnu@example.com'])
            ->assertOk()
            ->assertJsonStructure(['message']);
    }

    public function test_cron_protege_par_secret(): void
    {
        config(['agency.cron_secret' => 'secret-de-test']);

        $this->postJson('/api/cron/run')->assertForbidden();
        $this->postJson('/api/cron/run', [], ['X-Cron-Secret' => 'mauvais'])->assertForbidden();
        $this->postJson('/api/cron/run', [], ['X-Cron-Secret' => 'secret-de-test'])->assertOk();
    }

    public function test_webhook_wave_refuse_sans_secret(): void
    {
        config(['agency.payments.wave.webhook_secret' => null]);

        $this->postJson('/api/payments/webhook/wave', ['type' => 'checkout.session.completed'])
            ->assertStatus(503);
    }

    public function test_en_tetes_de_securite(): void
    {
        $this->getJson('/api/settings')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY');
    }
}
