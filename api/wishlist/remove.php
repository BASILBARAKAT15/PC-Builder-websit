<?php
require_once __DIR__ . '/../helpers.php';
require_method('POST');
$user = require_auth();
$d = body_json();
$name = trim($d['name'] ?? '');
if ($name === '') json_error('Name required');
db()->prepare('DELETE FROM wishlist WHERE user_id = ? AND product_name = ?')
    ->execute([$user['id'], $name]);
json_out(['ok' => true]);
