<?php
require_once __DIR__ . '/../helpers.php';
require_method('POST');
$user = require_auth();

$data     = body_json();
$username = trim($data['username'] ?? '');
$email    = strtolower(trim($data['email'] ?? ''));

if (strlen($username) < 3) json_error('Username must be at least 3 characters');
if (!valid_email($email))  json_error('Invalid email');

$pdo = db();
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id <> ?');
$stmt->execute([$email, $user['id']]);
if ($stmt->fetch()) json_error('Email already in use', 409);

$pdo->prepare('UPDATE users SET username = ?, email = ? WHERE id = ?')
    ->execute([$username, $email, $user['id']]);

json_out(['ok' => true, 'username' => $username, 'email' => $email]);
