<?php
session_start();
if(!isset($_SESSION['admin'])) {
    header("Location: login.php");
    exit();
}

require '../db.php';

$id = $_GET['id'];
$sql = "SELECT * FROM products WHERE id=$id";
$result = $conn->query($sql);
$product = $result->fetch_assoc();

if($_SERVER['REQUEST_METHOD'] == 'POST') {
    $name = $_POST['name'];
    $price = $_POST['price'];
    $stock = $_POST['stock'];
    $image = $_FILES['image']['name'];
    $tmp_name = $_FILES['image']['tmp_name'];

    if($image) {
        // Hapus gambar lama
        unlink("../assets/img/".$product['image']);
        
        // Upload gambar baru
        move_uploaded_file($tmp_name, "../assets/img/".$image);
        $sql = "UPDATE products SET name='$name', price='$price', stock='$stock', image='$image' WHERE id=$id";
    } else {
        $sql = "UPDATE products SET name='$name', price='$price', stock='$stock' WHERE id=$id";
    }

    if($conn->query($sql)) {
        header("Location: panel.php");
        exit();
    } else {
        echo "Error: " . $sql . "<br>" . $conn->error;
    }
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Edit Produk - Toko Fauqiyya</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">Edit Produk</a>
        </div>
    </nav>

    <div class="container mt-4">
        <form method="POST" enctype="multipart/form-data">
            <div class="mb-3">
                <label>Nama Produk</label>
                <input type="text" name="name" class="form-control" value="<?php echo $product['name']; ?>" required>
            </div>
            <div class="mb-3">
                <label>Harga</label>
                <input type="number" name="price" class="form-control" value="<?php echo $product['price']; ?>" required>
            </div>
            <div class="mb-3">
                <label>Stok</label>
                <input type="number" name="stock" class="form-control" value="<?php echo $product['stock']; ?>" required>
            </div>
            <div class="mb-3">
                <label>Gambar Saat Ini</label><br>
                <img src="../../assets/img/<?php echo $product['image']; ?>" width="100">
            </div>
            <div class="mb-3">
                <label>Gambar Baru</label>
                <input type="file" name="image" class="form-control">
            </div>
            <button type="submit" class="btn btn-primary">Update</button>
        </form>
    </div>
</body>
</html>