<?php
require_once __DIR__ . '/../helpers.php';
require_method('POST'); require_admin();
$id=(int)(body_json()['id']??0);
if ($id<=0) json_error('Invalid id');
$s=db()->prepare('SELECT is_active FROM coupons WHERE id=?'); $s->execute([$id]); $c=$s->fetch();
if (!$c) json_error('Not found',404);
$new=$c['is_active']?0:1;
db()->prepare('UPDATE coupons SET is_active=? WHERE id=?')->execute([$new,$id]);
json_out(['ok'=>true,'is_active'=>$new]);
