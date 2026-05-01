<?php
require_once __DIR__ . '/../helpers.php';
require_method('POST'); require_admin();
$d=body_json();
$id=(int)($d['id']??0);
$status=trim($d['status']??'');
$allowed=['pending','processing','shipped','delivered','cancelled'];
if ($id<=0||!in_array($status,$allowed,true)) json_error('Invalid data');
db()->prepare('UPDATE orders SET status=? WHERE id=?')->execute([$status,$id]);
json_out(['ok'=>true]);
