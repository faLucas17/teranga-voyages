<?php

namespace App\Http\Controllers;

abstract class Controller
{
    /**
     * Nombre d'éléments par page (borné pour éviter les abus).
     */
    protected function perPage(\Illuminate\Http\Request $request, int $default = 12): int
    {
        return max(1, min(100, (int) $request->integer('per_page', $default)));
    }
}
