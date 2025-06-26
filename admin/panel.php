<?php
session_start();
if(!isset($_SESSION['admin'])) {
    header("Location: login.php");
    exit();
}

require '../db.php';

// Ambil data produk
$sql = "SELECT * FROM products";
$result = $conn->query($sql);
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - Toko Fauqiyya</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">Admin Panel</a>
            <div class="d-flex">
                <a href="logout.php" class="btn btn-outline-light">Logout</a>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <div class="d-flex flex-column flex-md-row justify-content-between mb-4">
            <h3>Data Produk</h3>
            <div class="mt-2 mt-md-0">
                <a href="add_product.php" class="btn btn-success mb-2 mb-md-0">Tambah Produk</a>
                <a href="transaction.php" class="btn btn-info text-white mb-2 mb-md-0">Transaksi</a>
                <a href="transaction_history.php" class="btn btn-secondary text-white">Riwayat Transaksi</a>
            </div>
        </div>

        <div class="table-responsive">
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Nama Produk</th>
                        <th>Harga</th>
                        <th>Stok</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    <?php while($row = $result->fetch_assoc()) { ?>
                    <tr>
                        <td><?php echo $row['id']; ?></td>
                        <td><?php echo $row['name']; ?></td>
                        <td>Rp <?php echo number_format($row['price']); ?></td>
                        <td><?php echo $row['stock']; ?></td>
                        <td>
                            <a href="edit_product.php?id=<?php echo $row['id']; ?>" class="btn btn-warning btn-sm">Edit</a>
                            <a href="delete_product.php?id=<?php echo $row['id']; ?>" class="btn btn-danger btn-sm" onclick="return confirm('Yakin hapus produk?')">Hapus</a>
                        </td>
                    </tr>
                    <?php } ?>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Modal Barang Masuk -->
    <div class="modal fade" id="barangMasuk" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Barang Masuk</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form action="stock_in.php" method="POST">
                        <div class="mb-3">
                            <label for="product" class="form-label">Pilih Produk</label>
                            <select class="form-select" name="product_id" required>
                                <?php 
                                $sql = "SELECT * FROM products";
                                $products = $conn->query($sql);
                                while($product = $products->fetch_assoc()) {
                                    echo "<option value='".$product['id']."'>".$product['name']."</option>";
                                }
                                ?>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="quantity" class="form-label">Jumlah</label>
                            <input type="number" class="form-control" name="quantity" required>
                        </div>
                        <button type="submit" class="btn btn-primary">Simpan</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Barang Keluar -->
    <div class="modal fade" id="barangKeluar" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Barang Keluar</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form action="stock_out.php" method="POST">
                        <div class="mb-3">
                            <label for="product" class="form-label">Pilih Produk</label>
                            <select class="form-select" name="product_id" required>
                                <?php 
                                $sql = "SELECT * FROM products";
                                $products = $conn->query($sql);
                                while($product = $products->fetch_assoc()) {
                                    echo "<option value='".$product['id']."'>".$product['name']."</option>";
                                }
                                ?>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="quantity" class="form-label">Jumlah</label>
                            <input type="number" class="form-control" name="quantity" required>
                        </div>
                        <button type="submit" class="btn btn-warning text-white">Simpan</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>