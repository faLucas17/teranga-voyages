<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_un_visiteur_peut_creer_un_compte(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Aminata Fall',
            'email' => 'aminata@example.com',
            'password' => 'motdepasse123',
            'password_confirmation' => 'motdepasse123',
        ]);

        $response->assertCreated()->assertJsonStructure(['user' => ['id', 'email', 'role'], 'token']);
        $this->assertSame('client', $response->json('user.role'));
    }

    public function test_connexion_et_profil(): void
    {
        User::factory()->create(['email' => 'test@example.com']);

        $token = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password',
        ])->assertOk()->json('token');

        $this->withToken($token)->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('email', 'test@example.com');
    }

    public function test_mauvais_mot_de_passe_refuse(): void
    {
        User::factory()->create(['email' => 'test@example.com']);

        $this->postJson('/api/auth/login', ['email' => 'test@example.com', 'password' => 'faux'])
            ->assertUnprocessable();
    }

    public function test_un_client_ne_peut_pas_acceder_au_back_office(): void
    {
        $client = User::factory()->create();

        $this->actingAs($client, 'sanctum')->getJson('/api/admin/dashboard')->assertForbidden();
    }

    public function test_un_admin_accede_au_tableau_de_bord(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonStructure(['kpis' => ['revenue_total', 'bookings_total'], 'revenue_by_month']);
    }
}
