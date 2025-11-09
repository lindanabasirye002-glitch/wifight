<?php
// Application Constants
define('APP_NAME', 'WiFight');
define('APP_VERSION', '1.0.0');

// JWT Settings
// !!! IMPORTANT: Change this to a long, random string in production !!!
define('JWT_SECRET', 'your-very-secret-key-goes-here');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRY', 3600); // 1 hour

// File Paths
define('UPLOAD_PATH', __DIR__ . '/../../storage/uploads/');
define('LOG_PATH', __DIR__ . '/../../storage/logs/');
define('EXPORT_PATH', __DIR__ . '/../../storage/exports/');
