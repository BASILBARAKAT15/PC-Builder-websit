<?php
require_once __DIR__ . '/../helpers.php';
require_method('POST');

$code = strtoupper(trim(body_json()['code'] ?? ''));
if ($code === '') json_error('Coupon code required');

$stmt = db()->prepare('SELECT code, discount, label FROM coupons WHERE code = ? AND is_active = 1');
$stmt->execute([$code]);
$c = $stmt->fetch();

if (!$c) json_error('Invalid or expired coupon', 400);

json_out([
    'code'     => $c['code'],
    'discount' => (int)$c['discount'],
    'label'    => $c['label'],
]);
