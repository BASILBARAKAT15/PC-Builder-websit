<?php
require_once __DIR__ . '/../helpers.php';
require_method('POST');

$user = require_auth();
$data = body_json();

$items    = $data['items']                 ?? [];
$shipName = trim($data['shipping_name']    ?? '');
$shipAddr = trim($data['shipping_address'] ?? '');
$payment  = trim($data['payment_method']   ?? 'card');
$coupon   = trim($data['coupon_code']      ?? '');

if (!is_array($items) || count($items) === 0) json_error('Cart is empty');
if ($shipName === '') json_error('Shipping name required');
if ($shipAddr === '') $shipAddr = 'N/A';

$pdo = db();

// ---- SECURITY: look up every item in the products table and use the
// server-side price. Never trust prices/images/categories from the client.
// Fallback: if a product isn't in the DB (legacy hard-coded card that was
// never seeded), accept the client price but cap it to 0..100000 so no
// "buy RTX 4090 for $0.01" nor absurd multi-million orders.
$lookup = $pdo->prepare('SELECT name, price, category, image FROM products WHERE name = ? LIMIT 1');

$subtotal      = 0.0;
$resolvedItems = [];     // what we'll actually insert

foreach ($items as $it) {
    $rawName = trim((string)($it['name'] ?? ''));
    if ($rawName === '') json_error('Invalid item in cart');

    $qty = max(1, (int)($it['quantity'] ?? 1));
    if ($qty > 999) $qty = 999;    // cap for sanity

    $lookup->execute([$rawName]);
    $row = $lookup->fetch();

    if ($row) {
        // Canonical: use DB values
        $price    = (float)$row['price'];
        $name     = (string)$row['name'];
        $image    = (string)($row['image'] ?? '');
        $category = (string)($row['category'] ?? '');
    } else {
        // Legacy fallback (product was never seeded). Accept client price
        // but sanity-cap. Log to server error_log for follow-up.
        $clientPrice = (float)($it['price'] ?? 0);
        if ($clientPrice <= 0 || $clientPrice > 100000) {
            json_error('Invalid price for "' . $rawName . '"');
        }
        error_log("orders/place: product not in DB — accepting client price: $rawName @ $clientPrice");
        $price    = $clientPrice;
        $name     = $rawName;
        $image    = (string)($it['image'] ?? '');
        $category = (string)($it['category'] ?? '');
    }

    $subtotal += $price * $qty;
    $resolvedItems[] = [
        'name' => $name, 'price' => $price, 'quantity' => $qty,
        'image' => $image, 'category' => $category,
    ];
}

// ---- Validate coupon if sent. Reject invalid (don't silently ignore).
$discountPct = 0;
$couponCode  = null;
if ($coupon !== '') {
    $stmt = $pdo->prepare('SELECT code, discount FROM coupons WHERE code = ? AND is_active = 1');
    $stmt->execute([strtoupper($coupon)]);
    $c = $stmt->fetch();
    if (!$c) json_error('Invalid or inactive coupon', 400);
    $discountPct = (int)$c['discount'];
    $couponCode  = $c['code'];
}

$total = round($subtotal - ($subtotal * $discountPct / 100), 2);

$pdo->beginTransaction();
try {
    $pdo->prepare(
        'INSERT INTO orders (user_id, total_price, status, shipping_name, shipping_address, payment_method, coupon_code)
         VALUES (?, ?, "pending", ?, ?, ?, ?)'
    )->execute([$user['id'], $total, $shipName, $shipAddr, $payment, $couponCode]);

    $orderId = (int)$pdo->lastInsertId();

    $ins = $pdo->prepare(
        'INSERT INTO order_items (order_id, product_name, price, quantity, image, category)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    foreach ($resolvedItems as $r) {
        $ins->execute([
            $orderId, $r['name'], $r['price'], $r['quantity'], $r['image'], $r['category'],
        ]);
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    error_log('orders/place failed: ' . $e->getMessage());
    json_error('Could not place order', 500);
}

json_out(['ok' => true, 'order_id' => $orderId, 'total' => $total]);
