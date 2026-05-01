<?php
// ============================================
// api/config.php - shared config for all endpoints
// ============================================

// ---- CORS (same-origin under XAMPP; kept permissive for dev) ----
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
}
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---- Session ----
session_set_cookie_params([
    'lifetime' => 60 * 60 * 24 * 7, // 7 days
    'path'     => '/',
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

// ---- Database (XAMPP defaults) ----
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'pcbuilder_db');
define('DB_USER', 'root');
define('DB_PASS', '');

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]
            );
        } catch (PDOException $e) {
            // Log the real reason to PHP's error log (visible in XAMPP/Apache
            // logs, e.g. logs/php_error_log) so you can tell whether it's a
            // wrong password, missing DB, wrong host, or MySQL not running.
            error_log('DB connection failed: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit;
        }
    }
    return $pdo;
}
