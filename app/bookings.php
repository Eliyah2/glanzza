<?php
declare(strict_types=1);

// Glanzza — boekings-API (aanmaken, weeklijst, no-show-risico).
// Simpel HTTP: ?action=create|week  (POST voor create).

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

function require_auth(): array
{
    $user = current_user();
    if (!$user) {
        json_response(['ok' => false, 'error' => 'Niet ingelogd'], 401);
    }
    return $user;
}

function handle_bookings(): void
{
    $user = require_auth();
    $action = $_GET['action'] ?? ($_SERVER['REQUEST_METHOD'] === 'POST' ? 'create' : 'week');

    if ($action === 'week') {
        $stmt = db()->prepare(
            'SELECT b.id, b.starts_at, b.ends_at, b.deposit_cents, b.deposit_paid, b.status,
                    s.name AS service, c.name AS customer
             FROM bookings b
             JOIN services s  ON s.id = b.service_id
             JOIN customers c ON c.id = b.customer_id
             WHERE b.user_id = ? AND b.starts_at >= CURDATE()
             ORDER BY b.starts_at ASC'
        );
        $stmt->execute([$user['id']]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['no_show_risk'] = ((int) $r['deposit_paid'] === 0);
        }
        json_response(['ok' => true, 'bookings' => $rows]);
    }

    if ($action === 'create') {
        $in = json_decode(file_get_contents('php://input'), true) ?? [];
        $serviceId  = (int) ($in['service_id'] ?? 0);
        $customerId = (int) ($in['customer_id'] ?? 0);
        $startsAt   = (string) ($in['starts_at'] ?? '');
        $deposit    = max(0, (int) ($in['deposit_cents'] ?? 0));

        if (!$serviceId || !$customerId || !strtotime($startsAt)) {
            json_response(['ok' => false, 'error' => 'Ongeldige invoer'], 422);
        }

        // Duur van de dienst ophalen om end-time te bepalen.
        $s = db()->prepare('SELECT duration_min FROM services WHERE id = ? AND user_id = ?');
        $s->execute([$serviceId, $user['id']]);
        $svc = $s->fetch();
        if (!$svc) {
            json_response(['ok' => false, 'error' => 'Dienst niet gevonden'], 404);
        }
        $endsAt = date('Y-m-d H:i:s', strtotime($startsAt) + (int) $svc['duration_min'] * 60);

        $stmt = db()->prepare(
            'INSERT INTO bookings (user_id, service_id, customer_id, starts_at, ends_at, deposit_cents)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$user['id'], $serviceId, $customerId, $startsAt, $endsAt, $deposit]);
        json_response(['ok' => true, 'id' => (int) db()->lastInsertId(), 'deposit_cents' => $deposit], 201);
    }

    json_response(['ok' => false, 'error' => 'Onbekende actie'], 400);
}

handle_bookings();
