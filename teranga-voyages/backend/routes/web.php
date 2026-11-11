<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => config('agency.name').' API',
        'status' => 'ok',
        'docs' => url('/api'),
    ]);
});

// Nécessaire pour que le middleware "auth" sache où rediriger (non utilisé par le SPA)
Route::get('/login', fn () => response()->json(['message' => 'Non authentifié.'], 401))->name('login');
