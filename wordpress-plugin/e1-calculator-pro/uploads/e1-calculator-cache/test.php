<?php
header('Content-Type: text/plain; charset=utf-8');
echo "PHP works!\n";
echo "Current directory: " . __DIR__ . "\n";
echo "Files in directory:\n";
foreach (glob(__DIR__ . '/*') as $file) {
    echo basename($file) . " (" . filesize($file) . " bytes)\n";
}
?>