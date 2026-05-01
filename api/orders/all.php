<?php
require_once __DIR__ . '/../helpers.php';
require_admin();
$pdo=db();
$rows=$pdo->query(
    'SELECT o.id, o.user_id, o.total_price, o.status, o.shipping_name,
            o.shipping_address, o.payment_method, o.coupon_code, o.created_at,
            u.username
     FROM orders o LEFT JOIN users u ON u.id=o.user_id
     ORDER BY o.id DESC'
)->fetchAll();
if ($rows) {
    $ids=array_column($rows,'id');
    $in=implode(',',array_fill(0,count($ids),'?'));
    $s=$pdo->prepare("SELECT order_id,product_name,price,quantity,image,category FROM order_items WHERE order_id IN ($in)");
    $s->execute($ids);
    $by=[]; foreach ($s->fetchAll() as $it) $by[$it['order_id']][]=$it;
    foreach ($rows as &$o) $o['items']=$by[$o['id']]??[];
}
json_out(['orders'=>$rows]);
