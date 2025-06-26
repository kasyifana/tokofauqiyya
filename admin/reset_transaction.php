<?php
session_start();
if(!isset($_SESSION['admin'])) {
    header("Location: login.php");
    exit();
}

require '../db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = $_POST['password'];
    
    // Gunakan password default admin
    $admin_password = 'admin'; // Sesuaikan dengan password admin yang benar
    
    if ($password === $admin_password) {
        // Password correct, proceed with reset
        if ($conn->query("TRUNCATE TABLE transactions")) {
            $_SESSION['success'] = "Seluruh data transaksi berhasil direset";
        } else {
            $_SESSION['error'] = "Gagal mereset transaksi: " . $conn->error;
        }
    } else {
        $_SESSION['error'] = "Password salah";
    }
}

header("Location: transaction_history.php");
exit();
