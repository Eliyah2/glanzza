<?php
declare(strict_types=1);

// Glanzza — registratie + login (sessies, password_hash).
// CSRF-token wordt toegevoegd vóór livegang (zie README "nog te doen").

require_once __DIR__ . '/db.php';

function start_session(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }
}

function current_user(): ?array
{
    start_session();
    return $_SESSION['user'] ?? null;
}

function register(string $name, string $email, string $password): array
{
    $email = strtolower(trim($email));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['ok' => false, 'error' => 'Ongeldig e-mailadres'];
    }
    if (strlen($password) < 8) {
        return ['ok' => false, 'error' => 'Wachtwoord moet minimaal 8 tekens zijn'];
    }
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = db()->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
    try {
        $stmt->execute([trim($name), $email, $hash]);
    } catch (PDOException $ex) {
        if ($ex->getCode() === '23000') {
            return ['ok' => false, 'error' => 'Dit e-mailadres is al in gebruik'];
        }
        throw $ex;
    }
    return ['ok' => true];
}

function login(string $email, string $password): array
{
    start_session();
    $stmt = db()->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([strtolower(trim($email))]);
    $user = $stmt->fetch();
    if (!$user || !password_verify($password, $user['password_hash'])) {
        return ['ok' => false, 'error' => 'Onjuiste inloggegevens'];
    }
    session_regenerate_id(true);
    unset($user['password_hash']);
    $_SESSION['user'] = $user;
    return ['ok' => true, 'user' => $user];
}

function logout(): void
{
    start_session();
    $_SESSION = [];
    session_destroy();
}
