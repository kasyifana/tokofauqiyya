<?php
session_start();
if(!isset($_SESSION['admin'])) {
    header("Location: login.php");
    exit();
}

require '../db.php';

$where = "1=1";
if(isset($_GET['start_date']) && isset($_GET['end_date'])) {
    $start = $_GET['start_date'];
    $end = $_GET['end_date'];
    $where = "DATE(t.date) BETWEEN '$start' AND '$end'";
}

// Modifikasi query untuk menghitung saldo dengan filter
$transactions = $conn->query("SELECT 
    t.*,
    p.name,
    p.price,
    @running_total := IF(t.type = 'out', @running_total + (t.quantity * p.price), @running_total) as running_balance
FROM 
    (SELECT @running_total := 0) r,
    transactions t
    JOIN products p ON t.product_id = p.id 
WHERE $where
ORDER BY date ASC");

// Hitung total saldo
$total_balance = 0;
$rows = [];
while($row = $transactions->fetch_assoc()) {
    $rows[] = $row;
    if($row['type'] == 'out') {
        $total_balance += ($row['quantity'] * $row['price']);
    }
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Riwayat Transaksi - Toko Fauqiyya</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .table-responsive {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }
        @media (max-width: 768px) {
            .export-buttons {
                margin-top: 1rem;
                text-align: left !important;
            }
            .export-buttons .btn {
                margin-bottom: 0.5rem;
                display: block;
                width: 100%;
            }
            .filter-form {
                margin-bottom: 1rem;
            }
        }
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container-fluid">
            <a class="navbar-brand" href="panel.php">Riwayat Transaksi</a>
            <div class="navbar-nav">
                <a class="nav-link" href="transaction.php">Kembali ke Transaksi</a>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <?php if(isset($_SESSION['error'])): ?>
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <?php echo $_SESSION['error']; unset($_SESSION['error']); ?>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        <?php endif; ?>
        
        <?php if(isset($_SESSION['success'])): ?>
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <?php echo $_SESSION['success']; unset($_SESSION['success']); ?>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        <?php endif; ?>
        
        <div class="row mb-4">
            <div class="col-md-6">
                <form class="row g-3 filter-form" method="GET">
                    <div class="col-auto">
                        <input type="date" class="form-control" name="start_date" value="<?php echo $_GET['start_date'] ?? ''; ?>">
                    </div>
                    <div class="col-auto">
                        <input type="date" class="form-control" name="end_date" value="<?php echo $_GET['end_date'] ?? ''; ?>">
                    </div>
                    <div class="col-auto">
                        <button type="submit" class="btn btn-primary">Filter</button>
                        <button type="button" class="btn btn-danger ms-2" data-bs-toggle="modal" data-bs-target="#resetModal">
                            Reset Transaksi
                        </button>
                    </div>
                </form>
            </div>
            <div class="col-md-6 export-buttons">
                <a href="export_transaction.php?period=week" class="btn btn-success">Export Minggu Ini</a>
                <a href="export_transaction.php?period=month" class="btn btn-success">Export Bulan Ini</a>
                <a href="export_monthly_report.php" class="btn btn-info">Laporan Bulanan Produk</a>
            </div>
        </div>

        <h3>Riwayat Transaksi</h3>
        <div class="table-responsive">
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Produk</th>
                        <th>Jenis</th>
                        <th>Jumlah</th>
                        <th>Harga</th>
                        <th>Total</th>
                        <th>Saldo</th>
                        <th>Tanggal</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach($rows as $row) { 
                        $total = $row['quantity'] * $row['price'];
                    ?>
                    <tr>
                        <td><?php echo $row['id']; ?></td>
                        <td><?php echo $row['name']; ?></td>
                        <td><?php echo ($row['type'] == 'in') ? 'Masuk' : 'Keluar'; ?></td>
                        <td><?php echo $row['quantity']; ?></td>
                        <td>Rp <?php echo number_format($row['price'], 0, ',', '.'); ?></td>
                        <td>Rp <?php echo number_format($total, 0, ',', '.'); ?></td>
                        <td>Rp <?php echo $row['type'] == 'out' ? number_format($row['running_balance'], 0, ',', '.') : '-'; ?></td>
                        <td><?php echo date('d/m/Y H:i', strtotime($row['date'])); ?></td>
                    </tr>
                    <?php } ?>
                    <tr class="table-primary">
                        <td colspan="6" class="text-end fw-bold">Total Saldo:</td>
                        <td colspan="2" class="fw-bold">Rp <?php echo number_format($total_balance, 0, ',', '.'); ?></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Reset Modal -->
    <div class="modal fade" id="resetModal" tabindex="-1" aria-labelledby="resetModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="resetModalLabel">Konfirmasi Reset Transaksi</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-danger">
                        <strong>Peringatan!</strong> Tindakan ini akan menghapus seluruh data transaksi dan tidak dapat dikembalikan.
                    </div>
                    <form id="resetForm" action="reset_transaction.php" method="POST">
                        <div class="mb-3">
                            <label for="password" class="form-label">Masukkan Password Admin</label>
                            <input type="password" class="form-control" id="password" name="password" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                    <button type="button" class="btn btn-danger" onclick="submitReset()">Reset Transaksi</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Add Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        function submitReset() {
            if(confirm('Apakah Anda yakin ingin mereset seluruh data transaksi?')) {
                document.getElementById('resetForm').submit();
            }
        }
    </script>
</body>
</html>
