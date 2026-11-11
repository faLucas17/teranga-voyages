<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_un_agent_gere_le_catalogue(): void
    {
        $agent = User::factory()->agent()->create();

        $destinationId = $this->actingAs($agent, 'sanctum')->postJson('/api/admin/destinations', [
            'name' => 'Zanzibar', 'country' => 'Tanzanie', 'is_featured' => true,
        ])->assertCreated()->assertJsonPath('slug', 'zanzibar')->json('id');

        $packageId = $this->actingAs($agent, 'sanctum')->postJson('/api/admin/packages', [
            'destination_id' => $destinationId,
            'title' => 'Zanzibar Découverte',
            'type' => 'sejour',
            'duration_days' => 7,
            'price' => 1200000,
            'seats_total' => 10,
            'included' => ['Vol', 'Hôtel'],
        ])->assertCreated()->assertJsonPath('seats_available', 10)->json('id');

        $this->actingAs($agent, 'sanctum')->putJson("/api/admin/packages/{$packageId}", [
            'destination_id' => $destinationId,
            'title' => 'Zanzibar Découverte',
            'type' => 'sejour',
            'duration_days' => 8,
            'price' => 1300000,
            'seats_total' => 10,
        ])->assertOk()->assertJsonPath('price', 1300000);

        $this->actingAs($agent, 'sanctum')->getJson('/api/admin/packages?q=Zanzibar')
            ->assertOk()->assertJsonPath('total', 1);

        $this->actingAs($agent, 'sanctum')->deleteJson("/api/admin/packages/{$packageId}")->assertOk();
    }

    public function test_seul_l_admin_gere_les_utilisateurs(): void
    {
        $agent = User::factory()->agent()->create();
        $admin = User::factory()->admin()->create();

        $this->actingAs($agent, 'sanctum')->getJson('/api/admin/users')->assertForbidden();
        $this->actingAs($admin, 'sanctum')->getJson('/api/admin/users')->assertOk();
    }

    public function test_formulaires_publics(): void
    {
        $this->postJson('/api/contact', [
            'name' => 'Ibrahima', 'email' => 'ibra@example.com', 'subject' => 'Devis',
            'message' => 'Bonjour, je voudrais un devis pour Dubaï.',
        ])->assertCreated();

        $this->postJson('/api/visa-requests', [
            'full_name' => 'Ibrahima Ba', 'email' => 'ibra@example.com', 'phone' => '770000000',
            'destination_country' => 'Turquie', 'visa_type' => 'tourisme',
        ])->assertCreated()->assertJsonStructure(['visa_request' => ['reference']]);
    }
}
