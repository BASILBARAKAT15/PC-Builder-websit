<?php
require_once __DIR__ . '/../helpers.php';
require_method('POST'); require_admin();
$d=body_json();
$name=trim($d['name']??''); $price=(float)($d['price']??0);
$category=trim($d['category']??''); $stock=(int)($d['stock']??0); $image=trim($d['image']??'');
$specs = $d['specs'] ?? null;    // expect object {key: value}
if ($name===''||$price<=0||$category==='') json_error('Invalid product data');

// Serialize specs if provided (must be a non-empty object)
$specsJson = null;
if (is_array($specs) && count($specs) > 0) {
    // Filter out empty keys/values so we don't store junk
    $clean = [];
    foreach ($specs as $k => $v) {
        $k = trim((string)$k); $v = trim((string)$v);
        if ($k !== '' && $v !== '') $clean[$k] = $v;
    }
    if (count($clean) > 0) $specsJson = json_encode($clean, JSON_UNESCAPED_UNICODE);
}

db()->prepare('INSERT INTO products (name,price,category,stock,image,specs) VALUES (?,?,?,?,?,?)')
    ->execute([$name,$price,$category,$stock,$image,$specsJson]);
json_out(['ok'=>true,'id'=>(int)db()->lastInsertId()]);
