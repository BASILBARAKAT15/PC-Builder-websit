<?php
// ============================================
// api/helpers.php
// ============================================

require_once __DIR__ . '/config.php';

function json_out($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function json_error(string $msg, int $status = 400): void {
    json_out(['error' => $msg], $status);
}

function body_json(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function require_method(string $method): void {
    if (strtoupper($_SERVER['REQUEST_METHOD']) !== strtoupper($method)) {
        json_error('Method not allowed', 405);
    }
}

function current_user(): ?array {
    if (empty($_SESSION['user_id'])) return null;
    $stmt = db()->prepare('SELECT id, username, email, role FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function require_auth(): array {
    $u = current_user();
    if (!$u) json_error('Not authenticated', 401);
    return $u;
}

function require_admin(): array {
    $u = require_auth();
    if ($u['role'] !== 'admin') json_error('Admin only', 403);
    return $u;
}

function valid_email(string $e): bool {
    return (bool) filter_var($e, FILTER_VALIDATE_EMAIL);
}
