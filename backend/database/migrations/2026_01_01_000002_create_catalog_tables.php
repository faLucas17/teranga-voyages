<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Catalogue : destinations, forfaits (voyages organisés), hôtels, vols.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('destinations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('country', 100);
            $table->string('continent', 50)->nullable();
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->string('best_period')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('travel_packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('destination_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('type', 30)->default('sejour'); // sejour | circuit | pelerinage | safari | croisiere | weekend
            $table->string('summary', 500)->nullable();
            $table->text('description')->nullable();
            $table->json('itinerary')->nullable();   // [{day:1, title:"", description:""}]
            $table->json('included')->nullable();    // ["Billet d'avion", ...]
            $table->json('excluded')->nullable();
            $table->json('gallery')->nullable();
            $table->string('cover_image')->nullable();
            $table->unsignedSmallInteger('duration_days')->default(1);
            $table->string('departure_city', 100)->default('Dakar');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->unsignedBigInteger('price');              // prix adulte (en unité monétaire, ex: FCFA)
            $table->unsignedBigInteger('child_price')->nullable();
            $table->unsignedInteger('seats_total')->default(20);
            $table->unsignedInteger('seats_available')->default(20);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'type']);
        });

        Schema::create('hotels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('destination_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->unsignedTinyInteger('stars')->default(3);
            $table->string('address')->nullable();
            $table->text('description')->nullable();
            $table->json('amenities')->nullable();
            $table->string('image')->nullable();
            $table->unsignedBigInteger('price_per_night');
            $table->unsignedInteger('rooms_available')->default(10);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('flights', function (Blueprint $table) {
            $table->id();
            $table->string('airline', 100);
            $table->string('flight_number', 20);
            $table->string('from_city', 100);
            $table->string('from_code', 5);
            $table->string('to_city', 100);
            $table->string('to_code', 5);
            $table->dateTime('departure_at');
            $table->dateTime('arrival_at');
            $table->string('cabin_class', 20)->default('economy'); // economy | premium | business | first
            $table->unsignedBigInteger('price');
            $table->unsignedInteger('seats_available')->default(50);
            $table->string('baggage')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['from_code', 'to_code', 'departure_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flights');
        Schema::dropIfExists('hotels');
        Schema::dropIfExists('travel_packages');
        Schema::dropIfExists('destinations');
    }
};
