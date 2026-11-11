<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Destination;
use App\Models\Flight;
use App\Models\Hotel;
use App\Models\Review;
use App\Models\TravelPackage;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Catalogue public : destinations, forfaits, hôtels, vols, avis.
 */
class CatalogController extends Controller
{
    /* ---------------------------- Destinations ---------------------------- */

    public function destinations(Request $request): JsonResponse
    {
        $destinations = Destination::active()
            ->withCount(['packages' => fn ($q) => $q->where('is_active', true)])
            ->withMin(['packages' => fn ($q) => $q->where('is_active', true)], 'price')
            ->when($request->boolean('featured'), fn ($q) => $q->where('is_featured', true))
            ->when($request->filled('continent'), fn ($q) => $q->where('continent', $request->string('continent')))
            ->when($request->filled('q'), fn ($q) => $q->where(fn ($w) => $w
                ->where('name', 'like', '%'.$request->string('q').'%')
                ->orWhere('country', 'like', '%'.$request->string('q').'%')))
            ->orderByDesc('is_featured')
            ->orderBy('name')
            ->get();

        return response()->json($destinations);
    }

    public function destination(Destination $destination): JsonResponse
    {
        abort_unless($destination->is_active, 404);

        $destination->load([
            'packages' => fn ($q) => $q->active()->withAvg('approvedReviews', 'rating')->orderBy('price'),
            'hotels' => fn ($q) => $q->active()->orderBy('price_per_night'),
        ]);

        return response()->json($destination);
    }

    /* ------------------------------ Forfaits ------------------------------ */

    public function packages(Request $request): JsonResponse
    {
        $query = TravelPackage::active()
            ->with('destination:id,name,slug,country')
            ->withAvg('approvedReviews', 'rating')
            ->withCount('approvedReviews');

        $this->filterPackages($query, $request);

        match ($request->string('sort')->toString()) {
            'price_asc' => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            'duration' => $query->orderBy('duration_days'),
            'date' => $query->orderBy('start_date'),
            'rating' => $query->orderByDesc('approved_reviews_avg_rating'),
            default => $query->orderByDesc('is_featured')->latest(),
        };

        return response()->json($query->paginate($this->perPage($request)));
    }

    private function filterPackages(Builder $query, Request $request): void
    {
        $query
            ->when($request->filled('q'), fn ($q) => $q->where(fn ($w) => $w
                ->where('title', 'like', '%'.$request->string('q').'%')
                ->orWhere('summary', 'like', '%'.$request->string('q').'%')
                ->orWhereHas('destination', fn ($d) => $d
                    ->where('name', 'like', '%'.$request->string('q').'%')
                    ->orWhere('country', 'like', '%'.$request->string('q').'%'))))
            ->when($request->filled('destination'), fn ($q) => $q->whereHas('destination', fn ($d) => $d
                ->where('slug', $request->string('destination'))
                ->orWhere('id', $request->integer('destination'))))
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->string('type')))
            ->when($request->filled('min_price'), fn ($q) => $q->where('price', '>=', $request->integer('min_price')))
            ->when($request->filled('max_price'), fn ($q) => $q->where('price', '<=', $request->integer('max_price')))
            ->when($request->filled('max_days'), fn ($q) => $q->where('duration_days', '<=', $request->integer('max_days')))
            ->when($request->filled('from'), fn ($q) => $q->where(fn ($w) => $w
                ->whereNull('start_date')->orWhere('start_date', '>=', $request->date('from'))))
            ->when($request->boolean('featured'), fn ($q) => $q->where('is_featured', true))
            ->when($request->boolean('available'), fn ($q) => $q->where('seats_available', '>', 0));
    }

    public function package(Request $request, TravelPackage $package): JsonResponse
    {
        abort_unless($package->is_active, 404);

        $package->load('destination')
            ->loadAvg('approvedReviews', 'rating')
            ->loadCount('approvedReviews');

        $user = $request->user('sanctum');
        $package->setAttribute('is_favorite', $user
            ? $user->favoritePackages()->whereKey($package->id)->exists()
            : false);

        $related = TravelPackage::active()
            ->where('id', '!=', $package->id)
            ->where(fn ($q) => $q->where('destination_id', $package->destination_id)->orWhere('type', $package->type))
            ->with('destination:id,name,slug,country')
            ->limit(3)
            ->get();

        return response()->json(['package' => $package, 'related' => $related]);
    }

    public function packageReviews(TravelPackage $package): JsonResponse
    {
        return response()->json(
            $package->approvedReviews()->with('user:id,name,avatar')->latest()->paginate(10)
        );
    }

    public function storeReview(Request $request, TravelPackage $package): JsonResponse
    {
        $data = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'title' => ['nullable', 'string', 'max:120'],
            'comment' => ['required', 'string', 'min:10', 'max:2000'],
        ]);

        $review = Review::updateOrCreate(
            ['user_id' => $request->user()->id, 'travel_package_id' => $package->id],
            $data + ['is_approved' => false]
        );

        return response()->json([
            'message' => 'Merci ! Votre avis sera publié après modération.',
            'review' => $review,
        ], 201);
    }

    /* ------------------------------- Hôtels ------------------------------- */

    public function hotels(Request $request): JsonResponse
    {
        $hotels = Hotel::active()
            ->with('destination:id,name,slug,country')
            ->when($request->filled('destination'), fn ($q) => $q->whereHas('destination', fn ($d) => $d
                ->where('slug', $request->string('destination'))
                ->orWhere('id', $request->integer('destination'))))
            ->when($request->filled('q'), fn ($q) => $q->where(fn ($w) => $w
                ->where('name', 'like', '%'.$request->string('q').'%')
                ->orWhere('address', 'like', '%'.$request->string('q').'%')))
            ->when($request->filled('stars'), fn ($q) => $q->where('stars', '>=', $request->integer('stars')))
            ->when($request->filled('max_price'), fn ($q) => $q->where('price_per_night', '<=', $request->integer('max_price')))
            ->orderBy('price_per_night', $request->string('sort')->toString() === 'price_desc' ? 'desc' : 'asc')
            ->paginate($this->perPage($request));

        return response()->json($hotels);
    }

    public function hotel(Hotel $hotel): JsonResponse
    {
        abort_unless($hotel->is_active, 404);

        return response()->json($hotel->load('destination'));
    }

    /* -------------------------------- Vols -------------------------------- */

    public function flights(Request $request): JsonResponse
    {
        $flights = Flight::active()
            ->where('departure_at', '>=', now())
            ->when($request->filled('from'), fn ($q) => $q->where(fn ($w) => $w
                ->where('from_code', strtoupper($request->string('from')))
                ->orWhere('from_city', 'like', '%'.$request->string('from').'%')))
            ->when($request->filled('to'), fn ($q) => $q->where(fn ($w) => $w
                ->where('to_code', strtoupper($request->string('to')))
                ->orWhere('to_city', 'like', '%'.$request->string('to').'%')))
            ->when($request->filled('date'), fn ($q) => $q->whereDate('departure_at', $request->date('date')))
            ->when($request->filled('cabin_class'), fn ($q) => $q->where('cabin_class', $request->string('cabin_class')))
            ->when($request->filled('passengers'), fn ($q) => $q->where('seats_available', '>=', $request->integer('passengers')))
            ->orderBy($request->string('sort')->toString() === 'price' ? 'price' : 'departure_at')
            ->paginate($this->perPage($request, 20));

        return response()->json($flights);
    }

    public function flight(Flight $flight): JsonResponse
    {
        abort_unless($flight->is_active, 404);

        return response()->json($flight);
    }

    /* ------------------------------ Accueil ------------------------------- */

    public function home(): JsonResponse
    {
        return response()->json([
            'featured_packages' => TravelPackage::active()->where('is_featured', true)
                ->with('destination:id,name,slug,country')
                ->withAvg('approvedReviews', 'rating')
                ->latest()->limit(6)->get(),
            'featured_destinations' => Destination::active()->where('is_featured', true)
                ->withMin(['packages' => fn ($q) => $q->where('is_active', true)], 'price')
                ->limit(8)->get(),
            'testimonials' => Review::where('is_approved', true)->where('rating', '>=', 4)
                ->with(['user:id,name,avatar', 'package:id,title,slug'])
                ->latest()->limit(6)->get(),
            'stats' => [
                'destinations' => Destination::active()->count(),
                'packages' => TravelPackage::active()->count(),
                'hotels' => Hotel::active()->count(),
                'happy_travelers' => (int) \App\Models\Booking::whereIn('status', ['paid', 'completed'])
                    ->selectRaw('COALESCE(SUM(adults + children), 0) as total')->value('total'),
            ],
        ]);
    }
}
