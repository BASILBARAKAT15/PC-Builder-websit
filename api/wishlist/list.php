<?php
require_once __DIR__ . '/../helpers.php';
$user = require_auth();
$stmt = db()->prepare('SELECT id, product_name, price, image, category FROM wishlist WHERE user_id = ? ORDER BY id DESC');
$stmt->execute([$user['id']]);
json_out(['wishlist' => $stmt->fetchAll()]);
