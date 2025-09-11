<?php
// WordPress Loader JS Proxy - temporary fix for Apache/MAMP MIME type issues
header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: public, max-age=3600');
header('Access-Control-Allow-Origin: *');

$loader_file = __DIR__ . '/wordpress-loader.js';

if (file_exists($loader_file) && is_readable($loader_file)) {
    $content = file_get_contents($loader_file);
    if ($content !== false) {
        echo $content;
        exit;
    }
}

// Fallback error
http_response_code(404);
echo '// Loader file not found or not readable';
?>