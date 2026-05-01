<?php
require_once __DIR__ . '/../helpers.php';
require_method('POST'); require_admin();
$id=(int)(body_json()['id']??0);
if ($id<=0) json_error('Invalid id');
db()->prepare('DELETE FROM coupons WHERE id=?')->execute([$id]);
json_out(['ok'=>true]);
