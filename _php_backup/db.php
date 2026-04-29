<?php
$host = 'mysql-fauqiyya-kasyifana.c.aivencloud.com';
$user = 'avnadmin';
$pass = 'AVNS_BJPAwrr_-MqpO3KNd9t';
$db   = 'fauqiyya';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Koneksi gagal: " . $conn->connect_error);
}
?>