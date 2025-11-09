<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../models/Session.php';
require_once '../../utils/JWT.php';
require_once '../../utils/Response.php';
require_once '../../utils/Logger.php';

// Authenticate user
$payload = JWT::authenticate();

$database = new Database();
$db = $database->getConnection();

$session = new Session($db);

// Get posted data
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id) || !empty($data->mac_address)) {
    
    $reason = isset($data->reason) ? $data->reason : 'manual_disconnect';
    
    if (!empty($data->id)) {
        if ($session->terminate($data->id, $reason)) {
            Logger::activity($payload['user_id'], 'terminate_session', [
                'session_id' => $data->id,
                'reason' => $reason
            ]);
            
            Response::success(null, 'Session terminated successfully');
        } else {
            Response::error('Unable to terminate session', 500);
        }
    } else {
        if ($session->terminateByMac($data->mac_address)) {
            Logger::activity($payload['user_id'], 'terminate_session', [
                'mac_address' => $data->mac_address,
                'reason' => $reason
            ]);
            
            Response::success(null, 'Session terminated successfully');
        } else {
            Response::error('Unable to terminate session', 500);
        }
    }
} else {
    Response::error('Session ID or MAC address is required', 400);
}
?>