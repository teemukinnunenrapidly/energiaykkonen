<?php
header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: public, max-age=3600');

// Debug info
$widget_file = __DIR__ . '/widget.js';
$debug = [
    '__DIR__' => __DIR__,
    'widget_file' => $widget_file,
    'file_exists' => file_exists($widget_file),
    'file_size' => file_exists($widget_file) ? filesize($widget_file) : 0,
    'is_readable' => file_exists($widget_file) ? is_readable($widget_file) : false
];

// Comment out for debugging
echo '// DEBUG: ' . json_encode($debug) . "\n";

// Read the actual widget.js file
if (file_exists($widget_file) && is_readable($widget_file)) {
    $content = file_get_contents($widget_file);
    if ($content !== false) {
        echo $content;
    } else {
        echo '// Failed to read widget.js content';
    }
} else {
    http_response_code(404);
    echo '// Widget file not found or not readable';
}
?>