<?php

namespace Tests\Feature;

use App\Models\Coupon;
use App\Models\Destination;
use App\Models\Hotel;
use App\Models\TravelPackage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class BookingFlowTest extends TestCase
{
    use RefreshDatabase;

    private TravelPackage $package;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();

        $destination = Destination::create(['name' => 'Dubaï', 'country' => 'Émirats arabes unis']);
        $this->package = TravelPackage::create([
            'destination_id' => $destination->id,
            'title' => 'Dubaï Express',
            'type' => 'sejour',
            'duration_days' => 5,
            'start_date' => now()->addMonth(),
            'price' => 1000000,
            'child_price' => 600000,
            'seats_total' => 4,
            'seats_available' => 4,
        ]);
    }

    public function test_catalogue_public(): void
    {
        $this->getJson('/api/packages')->assertOk()->assertJsonPath('data.0.title', 'Dubaï Express');
        $this->getJson('/api/packages/'.$this->package->slug)->assertOk()->assertJsonPath('package.id', $this->package->id);
    }

    public function test_reservation_paiement_et_annulation(): void
    {
        $user = User::factory()->create();

        // Devis
        $this->postJson('/api/bookings/quote', [
            'bookable_type' => 'package', 'bookable_id' => $this->package->id, 'adults' => 2, 'children' => 1,
        ])->assertOk()->assertJsonPath('total', 2600000);

        // Réservation avec code promo
        Coupon::create(['code' => 'PROMO10', 'type' => 'percent', 'value' => 10]);

        $booking = $this->actingAs($user, 'sanctum')->postJson('/api/bookings', [
            'bookable_type' => 'package',
            'bookable_id' => $this->package->id,
            'adults' => 2,
            'children' => 1,
            'coupon_code' => 'promo10',
            'travelers' => [
                ['first_name' => 'Moussa', 'last_name' => 'Diop', 'type' => 'adult'],
            ],
        ])->assertCreated()
            ->assertJsonPath('total', 2340000)
            ->assertJsonPath('status', 'pending')
            ->json();

        $this->assertSame(1, $this->package->fresh()->seats_available);

        // Paiement (mode simulation)
        $this->actingAs($user, 'sanctum')->postJson("/api/bookings/{$booking['id']}/pay", ['method' => 'wave'])
            ->assertOk()
            ->assertJsonPath('booking.status', 'paid')
            ->assertJsonPath('payment.status', 'succeeded');

        // Une réservation payée ne s'annule plus en ligne
        $this->actingAs($user, 'sanctum')->postJson("/api/bookings/{$booking['id']}/cancel")->assertUnprocessable();
    }

    public function test_annulation_libere_les_places(): void
    {
        $user = User::factory()->create();

        $booking = $this->actingAs($user, 'sanctum')->postJson('/api/bookings', [
            'bookable_type' => 'package', 'bookable_id' => $this->package->id, 'adults' => 3,
        ])->assertCreated()->json();

        $this->assertSame(1, $this->package->fresh()->seats_available);

        $this->actingAs($user, 'sanctum')->postJson("/api/bookings/{$booking['id']}/cancel")
            ->assertOk()->assertJsonPath('status', 'cancelled');

        $this->assertSame(4, $this->package->fresh()->seats_available);
    }

    public function test_impossible_de_depasser_les_places(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')->postJson('/api/bookings', [
            'bookable_type' => 'package', 'bookable_id' => $this->package->id, 'adults' => 5,
        ])->assertUnprocessable()->assertJsonValidationErrors('adults');
    }

    public function test_reservation_hotel_calcule_les_nuits(): void
    {
        $user = User::factory()->create();
        $hotel = Hotel::create([
            'destination_id' => $this->package->destination_id,
            'name' => 'Hôtel Test', 'stars' => 4, 'price_per_night' => 50000, 'rooms_available' => 5,
        ]);

        $this->actingAs($user, 'sanctum')->postJson('/api/bookings', [
            'bookable_type' => 'hotel',
            'bookable_id' => $hotel->id,
            'adults' => 2,
            'rooms' => 1,
            'start_date' => now()->addDays(10)->toDateString(),
            'end_date' => now()->addDays(13)->toDateString(),
        ])->assertCreated()->assertJsonPath('total', 150000);

        $this->assertSame(4, $hotel->fresh()->rooms_available);
    }

    public function test_un_client_ne_voit_pas_la_reservation_d_un_autre(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();

        $booking = $this->actingAs($owner, 'sanctum')->postJson('/api/bookings', [
            'bookable_type' => 'package', 'bookable_id' => $this->package->id, 'adults' => 1,
        ])->json();

        $this->actingAs($other, 'sanctum')->getJson("/api/bookings/{$booking['id']}")->assertForbidden();
    }
}
