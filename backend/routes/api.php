<?php

use App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\CustomerController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Teranga Voyages  (préfixe automatique : /api)
|--------------------------------------------------------------------------
*/

Route::get('/', fn () => response()->json([
    'name' => config('agency.name').' API',
    'version' => '1.0.0',
]));

Route::middleware('throttle:api')->group(function () {

    /* ------------------------------ Public ------------------------------ */
    Route::get('settings', [CustomerController::class, 'settings']);
    Route::get('home', [CatalogController::class, 'home']);

    Route::get('destinations', [CatalogController::class, 'destinations']);
    Route::get('destinations/{destination}', [CatalogController::class, 'destination']);

    Route::get('packages', [CatalogController::class, 'packages']);
    Route::get('packages/{package}', [CatalogController::class, 'package']);
    Route::get('packages/{package}/reviews', [CatalogController::class, 'packageReviews']);

    Route::get('hotels', [CatalogController::class, 'hotels']);
    Route::get('hotels/{hotel}', [CatalogController::class, 'hotel']);

    Route::get('flights', [CatalogController::class, 'flights']);
    Route::get('flights/{flight}', [CatalogController::class, 'flight']);

    Route::post('bookings/quote', [BookingController::class, 'quote']);
    Route::post('coupons/check', [CustomerController::class, 'checkCoupon']);

    Route::middleware('throttle:forms')->group(function () {
        Route::post('contact', [CustomerController::class, 'contact']);
        Route::post('newsletter', [CustomerController::class, 'newsletter']);
        Route::post('visa-requests', [CustomerController::class, 'storeVisa']);
    });

    Route::post('payments/webhook/{provider}', [CustomerController::class, 'paymentWebhook'])
        ->withoutMiddleware('throttle:api');

    // Tâches de maintenance appelées par un cron externe (Render gratuit n'a pas de planificateur)
    Route::post('cron/run', \App\Http\Controllers\Api\CronController::class)
        ->middleware('throttle:forms');

    /* --------------------------- Authentification --------------------------- */
    Route::prefix('auth')->group(function () {
        Route::middleware('throttle:auth')->group(function () {
            Route::post('register', [AuthController::class, 'register']);
            Route::post('login', [AuthController::class, 'login']);
            Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
            Route::post('reset-password', [AuthController::class, 'resetPassword']);
        });

        Route::middleware(['auth:sanctum', 'active'])->group(function () {
            Route::get('me', [AuthController::class, 'me']);
            Route::post('logout', [AuthController::class, 'logout']);
            Route::put('profile', [AuthController::class, 'updateProfile']);
            Route::put('password', [AuthController::class, 'updatePassword']);
        });
    });

    /* ---------------------------- Espace client ---------------------------- */
    Route::middleware(['auth:sanctum', 'active'])->group(function () {
        Route::get('bookings', [BookingController::class, 'index']);
        Route::post('bookings', [BookingController::class, 'store']);
        Route::get('bookings/{booking}', [BookingController::class, 'show']);
        Route::post('bookings/{booking}/cancel', [BookingController::class, 'cancel']);
        Route::post('bookings/{booking}/pay', [BookingController::class, 'pay']);

        Route::get('favorites', [CustomerController::class, 'favorites']);
        Route::post('packages/{package}/favorite', [CustomerController::class, 'toggleFavorite']);
        Route::post('packages/{package}/reviews', [CatalogController::class, 'storeReview']);

        Route::get('my/visa-requests', [CustomerController::class, 'myVisas']);
    });

    /* ----------------------------- Back-office ----------------------------- */
    Route::prefix('admin')
        ->middleware(['auth:sanctum', 'active', 'role:admin,agent'])
        ->group(function () {
            Route::get('dashboard', Admin\DashboardController::class);

            // Catalogue (CRUD générique, liaison par identifiant numérique)
            foreach ([
                'destinations' => Admin\DestinationController::class,
                'packages' => Admin\PackageController::class,
                'hotels' => Admin\HotelController::class,
                'flights' => Admin\FlightController::class,
                'coupons' => Admin\CouponController::class,
            ] as $uri => $controller) {
                Route::get($uri, [$controller, 'index']);
                Route::post($uri, [$controller, 'store']);
                Route::get("$uri/{id}", [$controller, 'show'])->whereNumber('id');
                Route::put("$uri/{id}", [$controller, 'update'])->whereNumber('id');
                Route::delete("$uri/{id}", [$controller, 'destroy'])->whereNumber('id');
            }

            // Réservations & paiements
            Route::get('bookings', [Admin\BookingAdminController::class, 'index']);
            Route::get('bookings/export', [Admin\BookingAdminController::class, 'export']);
            Route::get('bookings/{booking}', [Admin\BookingAdminController::class, 'show']);
            Route::put('bookings/{booking}', [Admin\BookingAdminController::class, 'update']);
            Route::post('bookings/{booking}/payments', [Admin\BookingAdminController::class, 'recordPayment']);
            Route::get('payments', [Admin\BookingAdminController::class, 'payments']);
            Route::post('payments/{payment}/confirm', [Admin\BookingAdminController::class, 'confirmPayment']);

            // Relation client
            Route::get('reviews', [Admin\InboxController::class, 'reviews']);
            Route::put('reviews/{review}', [Admin\InboxController::class, 'updateReview']);
            Route::delete('reviews/{review}', [Admin\InboxController::class, 'destroyReview']);

            Route::get('messages', [Admin\InboxController::class, 'messages']);
            Route::put('messages/{message}', [Admin\InboxController::class, 'updateMessage']);
            Route::delete('messages/{message}', [Admin\InboxController::class, 'destroyMessage']);

            Route::get('visa-requests', [Admin\InboxController::class, 'visas']);
            Route::put('visa-requests/{visa}', [Admin\InboxController::class, 'updateVisa']);

            Route::get('newsletter', [Admin\InboxController::class, 'subscribers']);
            Route::post('uploads', [Admin\InboxController::class, 'upload']);

            // Réservé aux administrateurs
            Route::middleware('role:admin')->group(function () {
                Route::get('users', [Admin\UserController::class, 'index']);
                Route::post('users', [Admin\UserController::class, 'store']);
                Route::get('users/{user}', [Admin\UserController::class, 'show']);
                Route::put('users/{user}', [Admin\UserController::class, 'update']);
                Route::delete('users/{user}', [Admin\UserController::class, 'destroy']);

                Route::get('settings', [Admin\InboxController::class, 'settings']);
                Route::put('settings', [Admin\InboxController::class, 'updateSettings']);
            });
        });
});
