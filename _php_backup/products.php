<?php
header('Content-Type: application/json');

require 'db.php';

if (!$conn) {
    http_response_code(500);
    echo json_encode(['error' => 'Koneksi database gagal: ' . mysqli_connect_error()]);
    exit;
}

$sql = "SELECT * FROM products";
$result = $conn->query($sql);
$products = [];

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
}

$conn->close();
echo json_encode($products);
