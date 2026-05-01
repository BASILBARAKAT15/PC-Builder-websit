<?php
require_once __DIR__ . '/../helpers.php';
require_method('POST'); require_admin();
$d=body_json();
$code=strtoupper(trim($d['code']??'')); $discount=(int)($d['discount']??0);
$label=trim($d['label']??'');
if ($code===''||$discount<1||$discount>100) json_error('Invalid coupon');
if ($label==='') $label=$discount.'% Off';
try {
    db()->prepare('INSERT INTO coupons (code,discount,label,is_active) VALUES (?,?,?,1)')
        ->execute([$code,$discount,$label]);
} catch (PDOException $e) { json_error('Coupon code already exists',409); }
json_out(['ok'=>true,'id'=>(int)db()->lastInsertId()]);
