<?php
require_once __DIR__ . '/../helpers.php';
$user = require_auth();

$pdo = db();
$stmt = $pdo->prepare(
    'SELECT id, total_price, status, shipping_name, shipping_address, payment_method, coupon_code, created_at
     FROM orders WHERE user_id = ? ORDER BY id DESC'
);
$stmt->execute([$user['id']]);
$orders = $stmt->fetchAll();

if ($orders) {
    $ids = array_column($orders, 'id');
    $in  = implode(',', array_fill(0, count($ids), '?'));
    $iStmt = $pdo->prepare("SELECT order_id, product_name, price, quantity, image, category FROM order_items WHERE order_id IN ($in)");
    $iStmt->execute($ids);
    $byOrder = [];
    foreach ($iStmt->fetchAll() as $it) $byOrder[$it['order_id']][] = $it;
    foreach ($orders as &$o) $o['items'] = $byOrder[$o['id']] ?? [];
}

json_out(['orders' => $orders]);
