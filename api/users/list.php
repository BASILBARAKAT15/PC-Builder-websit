<?php
require_once __DIR__ . '/../helpers.php';
require_admin();
$rows=db()->query(
    'SELECT u.id, u.username, u.email, u.role, u.created_at,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id=u.id) AS order_count
     FROM users u ORDER BY u.id DESC'
)->fetchAll();
foreach ($rows as &$r) { $r['id']=(int)$r['id']; $r['order_count']=(int)$r['order_count']; }
json_out(['users'=>$rows]);
