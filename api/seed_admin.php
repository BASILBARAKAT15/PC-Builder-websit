<?php
// ============================================
// api/seed_admin.php
// Open once in browser to create/reset default admin
//   http://localhost/PC-Builder-websit-akram/api/seed_admin.php
// Delete this file after first run in production.
// ============================================

require_once __DIR__ . '/helpers.php';

$email    = 'admin@pcbuilder.local';
$username = 'Admin';
$password = 'Admin@123';
$hash     = password_hash($password, PASSWORD_DEFAULT);

$pdo = db();
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
$row = $stmt->fetch();

if ($row) {
    $pdo->prepare('UPDATE users SET password_hash = ?, role = "admin", username = ? WHERE id = ?')
        ->execute([$hash, $username, $row['id']]);
    json_out(['ok' => true, 'message' => 'Admin reset. Email: ' . $email . ' — Password: see source code.']);
} else {
    $pdo->prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, "admin")')
        ->execute([$username, $email, $hash]);
    json_out(['ok' => true, 'message' => 'Admin created. Email: ' . $email . ' — Password: see source code.']);
}
