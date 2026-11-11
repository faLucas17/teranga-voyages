<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\NewsletterSubscriber;
use App\Models\Review;
use App\Models\Setting;
use App\Models\VisaRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Modération et relation client : avis, messages, visas, newsletter, paramètres, médias.
 */
class InboxController extends Controller
{
    /* ------------------------------- Avis -------------------------------- */

    public function reviews(Request $request): JsonResponse
    {
        return response()->json(Review::with(['user:id,name,email', 'package:id,title,slug'])
            ->when($request->filled('is_approved'), fn ($q) => $q->where('is_approved', $request->boolean('is_approved')))
            ->latest()
            ->paginate($this->perPage($request, 15)));
    }

    public function updateReview(Request $request, Review $review): JsonResponse
    {
        $review->update($request->validate(['is_approved' => ['required', 'boolean']]));

        return response()->json($review->fresh(['user:id,name,email', 'package:id,title,slug']));
    }

    public function destroyReview(Review $review): JsonResponse
    {
        $review->delete();

        return response()->json(['message' => 'Avis supprimé.']);
    }

    /* ----------------------------- Messages ------------------------------ */

    public function messages(Request $request): JsonResponse
    {
        return response()->json(ContactMessage::query()
            ->when($request->filled('is_read'), fn ($q) => $q->where('is_read', $request->boolean('is_read')))
            ->when($request->filled('q'), fn ($q) => $q->where(fn ($w) => $w
                ->where('name', 'like', '%'.$request->string('q').'%')
                ->orWhere('email', 'like', '%'.$request->string('q').'%')
                ->orWhere('subject', 'like', '%'.$request->string('q').'%')))
            ->latest()
            ->paginate($this->perPage($request, 15)));
    }

    public function updateMessage(Request $request, ContactMessage $message): JsonResponse
    {
        $message->update($request->validate(['is_read' => ['required', 'boolean']]));

        return response()->json($message);
    }

    public function destroyMessage(ContactMessage $message): JsonResponse
    {
        $message->delete();

        return response()->json(['message' => 'Message supprimé.']);
    }

    /* ------------------------------- Visas ------------------------------- */

    public function visas(Request $request): JsonResponse
    {
        return response()->json(VisaRequest::query()
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('q'), fn ($q) => $q->where(fn ($w) => $w
                ->where('reference', 'like', '%'.$request->string('q').'%')
                ->orWhere('full_name', 'like', '%'.$request->string('q').'%')
                ->orWhere('destination_country', 'like', '%'.$request->string('q').'%')))
            ->latest()
            ->paginate($this->perPage($request, 15)));
    }

    public function updateVisa(Request $request, VisaRequest $visa): JsonResponse
    {
        $visa->update($request->validate([
            'status' => ['required', Rule::in(VisaRequest::STATUSES)],
            'admin_notes' => ['nullable', 'string', 'max:5000'],
        ]));

        return response()->json($visa);
    }

    /* ----------------------------- Newsletter ---------------------------- */

    public function subscribers(Request $request): JsonResponse
    {
        return response()->json(NewsletterSubscriber::latest()->paginate($this->perPage($request, 50)));
    }

    /* ----------------------------- Paramètres ---------------------------- */

    public function settings(): JsonResponse
    {
        return response()->json(Setting::orderBy('key')->get());
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string', 'max:100', 'regex:/^[a-z0-9_]+$/'],
            'settings.*.value' => ['nullable', 'string', 'max:5000'],
            'settings.*.is_public' => ['boolean'],
        ]);

        foreach ($data['settings'] as $row) {
            Setting::putValue($row['key'], $row['value'] ?? null, $row['is_public'] ?? true);
        }

        return response()->json(Setting::orderBy('key')->get());
    }

    /* ------------------------------- Médias ------------------------------ */

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'image', 'mimes:jpg,jpeg,png,webp,svg', 'max:5120'],
        ]);

        $path = $request->file('file')->storeAs(
            'uploads/'.now()->format('Y/m'),
            Str::uuid().'.'.$request->file('file')->extension(),
            'public'
        );

        return response()->json([
            'path' => $path,
            'url' => '/storage/'.$path,
        ], 201);
    }
}
