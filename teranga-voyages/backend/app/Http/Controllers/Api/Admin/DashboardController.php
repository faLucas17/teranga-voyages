<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\ContactMessage;
use App\Models\Payment;
use App\Models\Review;
use App\Models\TravelPackage;
use App\Models\User;
use App\Models\VisaRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $startOfMonth = now()->startOfMonth();

        // Chiffre d'affaires des 12 derniers mois (calculé en PHP pour rester compatible MySQL / SQLite)
        $payments = Payment::where('status', Payment::STATUS_SUCCEEDED)
            ->where('paid_at', '>=', now()->subMonths(11)->startOfMonth())
            ->get(['amount', 'paid_at']);

        $revenueByMonth = collect(range(11, 0))->map(function ($i) use ($payments) {
            $month = now()->subMonths($i);

            return [
                'month' => $month->translatedFormat('M Y'),
                'key' => $month->format('Y-m'),
                'revenue' => (int) $payments
                    ->filter(fn ($p) => Carbon::parse($p->paid_at)->format('Y-m') === $month->format('Y-m'))
                    ->sum('amount'),
            ];
        })->values();

        $bookingsByStatus = Booking::selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status');
        $bookingsByKind = Booking::selectRaw('bookable_type as kind, COUNT(*) as total')->groupBy('bookable_type')->pluck('total', 'kind');

        $topPackages = TravelPackage::withCount(['bookings' => fn ($q) => $q->whereIn('status', ['paid', 'confirmed', 'completed'])])
            ->orderByDesc('bookings_count')
            ->limit(5)
            ->get(['id', 'title', 'slug', 'price', 'seats_available']);

        return response()->json([
            'kpis' => [
                'revenue_total' => (int) Payment::where('status', Payment::STATUS_SUCCEEDED)->sum('amount'),
                'revenue_month' => (int) Payment::where('status', Payment::STATUS_SUCCEEDED)->where('paid_at', '>=', $startOfMonth)->sum('amount'),
                'bookings_total' => Booking::count(),
                'bookings_month' => Booking::where('created_at', '>=', $startOfMonth)->count(),
                'bookings_pending' => Booking::where('status', Booking::STATUS_PENDING)->count(),
                'clients' => User::where('role', User::ROLE_CLIENT)->count(),
                'packages_active' => TravelPackage::where('is_active', true)->count(),
                'unread_messages' => ContactMessage::where('is_read', false)->count(),
                'pending_reviews' => Review::where('is_approved', false)->count(),
                'open_visa_requests' => VisaRequest::whereIn('status', ['received', 'processing'])->count(),
                'pending_payments' => Payment::where('status', Payment::STATUS_PENDING)->count(),
            ],
            'revenue_by_month' => $revenueByMonth,
            'bookings_by_status' => $bookingsByStatus,
            'bookings_by_kind' => $bookingsByKind,
            'top_packages' => $topPackages,
            'latest_bookings' => Booking::with(['user:id,name', 'bookable'])->latest()->limit(8)->get(),
        ]);
    }
}
