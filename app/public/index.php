<?php
declare(strict_types=1);

// Glanzza — eenvoudig status-endpoint.
// Start lokaal:  php -S 127.0.0.1:8080 -t app/public
// Open dan:      http://127.0.0.1:8080/index.php

require_once __DIR__ . '/../db.php';

$ok = true;
$error = null;
try {
    db()->query('SELECT 1');
} catch (Throwable $ex) {
    $ok = false;
    $error = 'Database niet bereikbaar: ' . $ex->getMessage();
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'ok'      => $ok,
    'name'    => 'Glanzza API',
    'version' => '0.1.0 (MVP)',
    'error'   => $error,
], JSON_UNESCAPED_UNICODE);
