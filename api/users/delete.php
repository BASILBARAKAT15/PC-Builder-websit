<?php
require_once __DIR__ . '/../helpers.php';
require_method('POST');
$admin=require_admin();
$id=(int)(body_json()['id']??0);
if ($id<=0) json_error('Invalid id');
if ($id===(int)$admin['id']) json_error('Cannot delete yourself');
$s=db()->prepare('SELECT role FROM users WHERE id=?'); $s->execute([$id]); $row=$s->fetch();
if (!$row) json_error('User not found',404);
if ($row['role']==='admin') json_error('Cannot delete another admin');
db()->prepare('DELETE FROM users WHERE id=?')->execute([$id]);
json_out(['ok'=>true]);
