<?php
require_once __DIR__ . '/../helpers.php';
require_admin();
$rows=db()->query('SELECT id,code,discount,label,is_active,created_at FROM coupons ORDER BY id DESC')->fetchAll();
foreach ($rows as &$r) { $r['id']=(int)$r['id']; $r['discount']=(int)$r['discount']; $r['is_active']=(int)$r['is_active']; }
json_out(['coupons'=>$rows]);
