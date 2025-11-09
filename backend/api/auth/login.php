<?php
header('Content-Type: application/json; charset=utf-8');

// Include composer autoload (if you installed dependencies)
if (file_exists(__DIR__ . '/../../../vendor/autoload.php')) {
    require_once __DIR__ . '/../../../vendor/autoload.php';
}

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/constants.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../utils/logger.php';

// Read raw input and attempt JSON decode
$raw = file_get_contents("php://input");
$data = null;
if ($raw !== false && trim($raw) !== '') {
    $data = json_decode($raw);
}

// If there's no JSON body, fall back to form-encoded POST data
if (!$data || !is_object($data)) {
    $parsed = [];
    parse_str($raw, $parsed);
    if (!empty($parsed)) {
        $data = (object)$parsed;
    } elseif (!empty($_POST)) {
        $data = (object)$_POST;
    } else {
        $data = null;
    }
}

// Validate input
if (empty($data->email) || empty($data->password)) {
    Response::error('Email and password are required.', 400);
    exit();
}

$logFile = defined('LOG_PATH') ? LOG_PATH . 'login_error.log' : __DIR__ . '/../../storage/logs/login_error.log';

try {
    // Instantiate Database & connect
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        file_put_contents($logFile, date('c') . " - DB connect failed\n", FILE_APPEND);
        Response::error('Internal Server Error', 500);
        exit();
    }

    // Instantiate User object
    $user = new User($db);

    // Find user by email
    $foundUser = $user->findByEmail($data->email);

    if (!$foundUser) {
        Response::error('Invalid credentials.', 401);
        exit();
    }

    // Verify password
    if (!isset($user->password)) {
        file_put_contents($logFile, date('c') . " - user->password missing; user object: " . print_r($user, true) . "\n", FILE_APPEND);
        Response::error('Internal Server Error', 500);
        exit();
    }

    if (password_verify($data->password, $user->password)) {
        // Password is correct, create JWT
        $payload = [
            'iss' => 'wifight_api',
            'aud' => 'wifight_frontend',
            'iat' => time(),
            'exp' => time() + JWT_EXPIRY,
            'sub' => (int)$user->id
        ];

        // Encode JWT - prefer Firebase\JWT if installed
        if (class_exists('Firebase\\JWT\\JWT')) {
            $jwt = Firebase\JWT\JWT::encode($payload, JWT_SECRET, JWT_ALGORITHM);
        } elseif (function_exists('JWT::encode')) {
            $jwt = JWT::encode($payload, JWT_SECRET, JWT_ALGORITHM);
        } else {
            file_put_contents($logFile, date('c') . " - No JWT encoder available\n", FILE_APPEND);
            Response::error('Internal Server Error', 500);
            exit();
        }

        Response::success([
            'token' => $jwt,
            'user' => [
                'id' => (int)$user->id,
                'name' => $user->name ?? null,
                'email' => $user->email,
                'role' => $user->role ?? null
            ]
        ], 'Login successful.');
        exit();
    } else {
        Response::error('Invalid credentials.', 401);
        exit();
    }
} catch (Throwable $e) {
    file_put_contents($logFile, date('c') . ' Exception in login.php: ' . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n", FILE_APPEND);
    Response::error('Internal Server Error', 500);
    exit();
}