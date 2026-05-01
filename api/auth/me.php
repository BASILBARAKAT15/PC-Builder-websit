<?php
require_once __DIR__ . '/../helpers.php';

$u = current_user();
if (!$u) json_out(['loggedIn' => false]);

json_out([
    'loggedIn' => true,
    'user'     => [
        'id'       => (int)$u['id'],
        'username' => $u['username'],
        'email'    => $u['email'],
        'role'     => $u['role'],
    ],
]);
