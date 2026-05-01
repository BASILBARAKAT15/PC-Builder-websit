<?php
require_once __DIR__ . '/../helpers.php';
require_method('POST');

$data     = body_json();
$username = trim($data['username'] ?? '');
$email    = strtolower(trim($data['email'] ?? ''));
$password = (string)($data['password'] ?? '');

if (strlen($username) < 3)       json_error('Username must be at least 3 characters');
if (!valid_email($email))        json_error('Invalid email');
if (strlen($password) < 6)       json_error('Password must be at least 6 characters');

$pdo = db();
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) json_error('Email already registered', 409);

$hash = password_hash($password, PASSWORD_DEFAULT);
$pdo->prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, "user")')
    ->execute([$username, $email, $hash]);

json_out(['ok' => true, 'message' => 'Account created']);
