<?php

header('Content-Type: application/json');

$uploadDir = __DIR__ . '/../uploads/';

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode([
        'success' => false,
        'message' => 'file is not uploaded',
        'files' => $_FILES
    ]);
    exit;
}

$fileName = basename($_FILES['file']['name']);
$savePath = $uploadDir . $fileName;

$success = move_uploaded_file($_FILES['file']['tmp_name'], $savePath);

echo json_encode([
    'success' => $success,
    'path' => $success ? $savePath : null
]);
?>