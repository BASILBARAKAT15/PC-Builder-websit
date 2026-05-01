<?php
require_once __DIR__ . '/../helpers.php';
$user = require_auth();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) json_error('Invalid order id');

$pdo = db();
$stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
$stmt->execute([$id]);
$order = $stmt->fetch();
if (!$order) json_error('Order not found', 404);

if ($user['role'] !== 'admin' && (int)$order['user_id'] !== (int)$user['id']) {
    json_error('Forbidden', 403);
}

$iStmt = $pdo->prepare('SELECT product_name, price, quantity, image, category FROM order_items WHERE order_id = ?');
$iStmt->execute([$id]);
$order['items'] = $iStmt->fetchAll();

json_out(['order' => $order]);
