<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../models/Controller.php';
require_once '../../utils/JWT.php';
require_once '../../utils/Response.php';
require_once '../../utils/Validator.php';
require_once '../../utils/Logger.php';

// Authenticate user
$payload = JWT::authenticate();

// Check admin role
if ($payload['role'] !== 'admin' && $payload['role'] !== 'manager') {
    Response::error('Unauthorized access', 403);
    exit;
}

$database = new Database();
$db = $database->getConnection();

$controller = new Controller($db);

// Get posted data
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    
    $updateData = [];
    
    if (isset($data->name)) {
        $updateData['name'] = $data->name;
    }
    
    if (isset($data->ip_address)) {
        if (!Validator::ipAddress($data->ip_address)) {
            Response::error('Invalid IP address format', 400);
            exit;
        }
        $updateData['ip_address'] = $data->ip_address;
    }
    
    if (isset($data->port)) {
        $updateData['port'] = $data->port;
    }
    
    if (isset($data->username)) {
        $updateData['username'] = $data->username;
    }
    
    if (isset($data->password)) {
        $updateData['password'] = $data->password;
    }
    
    if (isset($data->site_id)) {
        $updateData['site_id'] = $data->site_id;
    }
    
    if (isset($data->status)) {
        $updateData['status'] = $data->status;
    }
    
    if ($controller->update($data->id, $updateData)) {
        Logger::activity($payload['user_id'], 'update_controller', [
            'controller_id' => $data->id
        ]);
        
        Response::success(null, 'Controller updated successfully');
    } else {
        Response::error('Unable to update controller', 500);
    }
} else {
    Response::error('Controller ID is required', 400);
}
?>