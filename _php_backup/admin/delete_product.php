<?php
session_start();
if(!isset($_SESSION['admin'])) {
    header("Location: login.php");
    exit();
}

require '../db.php';

$id = $_GET['id'];

// Hapus gambar
$sql = "SELECT image FROM products WHERE id=$id";
$result = $conn->query($sql);
$row = $result->fetch_assoc();
unlink("../assets/img/".$row['image']);

// Hapus data
$sql = "DELETE FROM products WHERE id=$id";
if($conn->query($sql)) {
    header("Location: panel.php");
    exit();
} else {
    echo "Error: " . $sql . "<br>" . $conn->error;
}
?>