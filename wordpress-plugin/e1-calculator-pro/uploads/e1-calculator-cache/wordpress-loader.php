<?php
header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: public, max-age=3600');

// Read the actual wordpress-loader.js file
$loader_file = __DIR__ . '/wordpress-loader.js';
if (file_exists($loader_file)) {
    echo file_get_contents($loader_file);
} else {
    http_response_code(404);
    echo '// Loader file not found';
}
?>