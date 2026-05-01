<?php
require_once __DIR__ . '/../helpers.php';
require_method('POST');
$user = require_auth();
$d = body_json();
$name = trim($d['name'] ?? '');
$price = (float)($d['price'] ?? 0);
$image = trim($d['image'] ?? '');
$category = trim($d['category'] ?? '');
if ($name === '') json_error('Name required');
try {
    db()->prepare('INSERT INTO wishlist (user_id, product_name, price, image, category) VALUES (?, ?, ?, ?, ?)')
        ->execute([$user['id'], $name, $price, $image, $category]);
} catch (PDOException $e) {
    // duplicate (uniq key) is fine — already in wishlist
}
json_out(['ok' => true]);
