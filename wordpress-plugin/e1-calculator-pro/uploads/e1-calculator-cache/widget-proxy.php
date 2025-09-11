<?php
// WordPress Widget JS Proxy - temporary fix for Apache/MAMP MIME type issues
header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: public, max-age=3600');
header('Access-Control-Allow-Origin: *');

$widget_file = __DIR__ . '/widget.js';

if (file_exists($widget_file) && is_readable($widget_file)) {
    $content = file_get_contents($widget_file);
    if ($content !== false) {
        echo $content;
        exit;
    }
}

// Fallback error
http_response_code(404);
echo '// Widget file not found or not readable';
?>