<?php
// Glanzza — configuratie. Kopieer dit bestand naar config.php en vul in.
// Bewaar dit bestand NOOIT met echte secrets in git.

return [
    'db' => [
        'host'    => '127.0.0.1',
        'port'    => 3306,
        'name'    => 'glanzza',
        'user'    => 'root',
        'pass'    => '',            // <-- vul in
    ],
    'app' => [
        'base_url' => 'http://127.0.0.1:8080',
        'env'      => 'local',      // local | production
    ],
    // Betaalprovider (testmodus). Laat leeg om aanbetalingen te simuleren.
    'mollie' => [
        'api_key' => '',            // test_... voor de testmodus
    ],
    // SMS-herinneringen (Pro-tier). Laat leeg in de MVP.
    'twilio' => [
        'sid'   => '',
        'token' => '',
        'from'  => '',
    ],
];
