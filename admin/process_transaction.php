<?php
session_start();
require '../db.php';

header('Content-Type: application/json');

try {
    $items = json_decode($_POST['items'], true);
    
    if (!$items || !is_array($items)) {
        throw new Exception('Data transaksi tidak valid');
    }

    $total = 0;
    $current_date = date('Y-m-d H:i:s');
    
    foreach($items as $item) {
        $product_id = intval($item['product_id']);
        $quantity = intval($item['quantity']);
        $price = floatval($item['price']);
        $total_price = floatval($item['total']);
        
        // Cek stok
        $stmt = mysqli_prepare($conn, "SELECT stock FROM products WHERE id = ?");
        mysqli_stmt_bind_param($stmt, "i", $product_id);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $product = mysqli_fetch_assoc($result);
        
        if (!$product || $product['stock'] < $quantity) {
            throw new Exception('Stok tidak mencukupi untuk produk: ' . $item['name']);
        }

        // Update stok
        $stmt = mysqli_prepare($conn, "UPDATE products SET stock = stock - ? WHERE id = ?");
        mysqli_stmt_bind_param($stmt, "ii", $quantity, $product_id);
        mysqli_stmt_execute($stmt);
        
        // Simpan transaksi dengan struktur yang benar
        $type = 'out';
        $stmt = mysqli_prepare($conn, "INSERT INTO transactions (product_id, type, quantity, price) VALUES (?, ?, ?, ?)");
        mysqli_stmt_bind_param($stmt, "isid", $product_id, $type, $quantity, $total_price);
        
        if (!mysqli_stmt_execute($stmt)) {
            throw new Exception(mysqli_error($conn));
        }
        
        $total += $total_price;
        mysqli_stmt_close($stmt);
    }
    
    echo json_encode([
        'success' => true,
        'status' => 'success',
        'total' => $total
    ], JSON_NUMERIC_CHECK);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'status' => 'error',
        'message' => $e->getMessage()
    ], JSON_NUMERIC_CHECK);
}

mysqli_close($conn);
