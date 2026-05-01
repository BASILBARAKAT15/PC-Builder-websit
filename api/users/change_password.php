<?php
require_once __DIR__ . '/../helpers.php';
require_method('POST');
$user = require_auth();

$data = body_json();
$old  = (string)($data['old_password'] ?? '');
$new  = (string)($data['new_password'] ?? '');

if (strlen($new) < 6) json_error('New password must be at least 6 characters');

$stmt = db()->prepare('SELECT password_hash FROM users WHERE id = ?');
$stmt->execute([$user['id']]);
$row = $stmt->fetch();

if (!$row || !password_verify($old, $row['password_hash'])) {
    json_error('Current password is incorrect', 401);
}

$hash = password_hash($new, PASSWORD_DEFAULT);
db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$hash, $user['id']]);

json_out(['ok' => true]);
