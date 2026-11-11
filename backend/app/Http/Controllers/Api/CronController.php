<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

/**
 * Point d'entrée pour un cron externe (GitHub Actions, cron-job.org...).
 * Protégé par un secret partagé : en-tête "X-Cron-Secret" = variable CRON_SECRET.
 */
class CronController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $secret = (string) config('agency.cron_secret');

        abort_if($secret === '', 503, 'CRON_SECRET non configuré.');
        abort_unless(hash_equals($secret, (string) $request->header('X-Cron-Secret')), 403, 'Accès refusé.');

        Artisan::call('app:maintenance');

        return response()->json(['ok' => true, 'output' => trim(Artisan::output())]);
    }
}
