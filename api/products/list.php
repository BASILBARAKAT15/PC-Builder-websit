<?php
require_once __DIR__ . '/../helpers.php';
$rows = db()->query('SELECT id, name, price, category, stock, image, specs FROM products ORDER BY id DESC')->fetchAll();
// Decode the JSON-encoded specs column so the client doesn't have to.
foreach ($rows as &$r) {
    if (!empty($r['specs'])) {
        $decoded = json_decode($r['specs'], true);
        $r['specs'] = is_array($decoded) ? $decoded : null;
    } else {
        $r['specs'] = null;
    }
}
json_out(['products' => $rows]);
