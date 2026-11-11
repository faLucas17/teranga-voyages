<?php

/*
| Complète la configuration par défaut de Laravel Sanctum.
| Les jetons de connexion expirent après SANCTUM_EXPIRATION minutes (7 jours par défaut) :
| un jeton volé ne reste pas valable indéfiniment.
*/

return [
    'expiration' => (int) env('SANCTUM_EXPIRATION', 60 * 24 * 7),
];
