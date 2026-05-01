<?php
require_once __DIR__ . '/../helpers.php';
require_method('POST');
$user = require_auth();
db()->prepare('DELETE FROM wishlist WHERE user_id = ?')->execute([$user['id']]);
json_out(['ok' => true]);
