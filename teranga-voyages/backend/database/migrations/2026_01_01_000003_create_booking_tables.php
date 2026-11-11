<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Réservations, voyageurs, paiements, codes promo.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('description')->nullable();
            $table->string('type', 10)->default('percent'); // percent | fixed
            $table->unsignedBigInteger('value');
            $table->unsignedBigInteger('min_amount')->default(0);
            $table->unsignedInteger('max_uses')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->dateTime('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 30)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->morphs('bookable'); // TravelPackage | Hotel | Flight
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->unsignedSmallInteger('adults')->default(1);
            $table->unsignedSmallInteger('children')->default(0);
            $table->unsignedBigInteger('subtotal');
            $table->unsignedBigInteger('discount')->default(0);
            $table->unsignedBigInteger('total');
            $table->string('currency', 5)->default('XOF');
            $table->string('status', 20)->default('pending')->index(); // pending | confirmed | paid | cancelled | completed
            $table->foreignId('coupon_id')->nullable()->constrained()->nullOnDelete();
            $table->string('contact_name')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone', 30)->nullable();
            $table->text('special_requests')->nullable();
            $table->json('meta')->nullable(); // ex: {rooms: 2, nights: 5}
            $table->text('admin_notes')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancellation_reason')->nullable();
            $table->timestamps();
        });

        Schema::create('travelers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('type', 10)->default('adult'); // adult | child
            $table->date('birth_date')->nullable();
            $table->string('nationality', 100)->nullable();
            $table->string('passport_number', 30)->nullable();
            $table->date('passport_expiry')->nullable();
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('amount');
            $table->string('currency', 5)->default('XOF');
            $table->string('method', 30);   // wave | orange_money | card | bank_transfer | cash
            $table->string('driver', 30)->default('simulation');
            $table->string('status', 20)->default('pending')->index(); // pending | succeeded | failed | refunded
            $table->string('transaction_ref')->nullable()->unique();
            $table->string('checkout_url')->nullable();
            $table->string('phone', 30)->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('travelers');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('coupons');
    }
};
