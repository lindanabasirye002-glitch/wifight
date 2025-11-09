<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../models/User.php';
require_once '../../utils/JWT.php';
require_once '../../utils/Response.php';

// Authenticate user
$payload = JWT::authenticate();

// Check admin/manager role
if ($payload['role'] !== 'admin' && $payload['role'] !== 'manager') {
    Response::error('Unauthorized access', 403);
    exit;
}

$database = new Database();
$db = $database->getConnection();

$user = new User($db);

// Get filters
$location_id = null;
$role = null;

if ($payload['role'] !== 'admin') {
    $location_id = $payload['location_id'];
}

if (isset($_GET['location_id'])) {
    $location_id = $_GET['location_id'];
}

if (isset($_GET['role'])) {
    $role = $_GET['role'];
}

$users = $user->getAll($location_id, $role);

// Remove passwords from response
foreach ($users as &$u) {
    unset($u['password']);
}

Response::success($users, 'Users retrieved successfully');
?>