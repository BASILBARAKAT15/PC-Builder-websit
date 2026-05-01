<?php
require_once __DIR__ . '/../helpers.php';
require_method('POST');

$data     = body_json();
$email    = strtolower(trim($data['email'] ?? ''));
$password = (string)($data['password'] ?? '');

if (!valid_email($email) || $password === '') json_error('Invalid credentials', 401);

$stmt = db()->prepare('SELECT id, username, email, password_hash, role FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    json_error('Invalid email or password', 401);
}

session_regenerate_id(true);
$_SESSION['user_id'] = (int)$user['id'];

json_out([
    'ok'       => true,
    'username' => $user['username'],
    'email'    => $user['email'],
    'role'     => $user['role'],
]);
