<?php
session_start();
if(!isset($_SESSION['admin'])) {
    header("Location: login.php");
    exit();
}

require '../db.php';

// Get current month's data
$month = date('Y-m');
$query = "SELECT 
    p.name,
    SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END) as total_sold,
    SUM(CASE WHEN t.type = 'out' THEN t.quantity * p.price ELSE 0 END) as total_income
FROM products p
LEFT JOIN transactions t ON p.id = t.product_id 
    AND DATE_FORMAT(t.date, '%Y-%m') = ?
GROUP BY p.id, p.name
HAVING total_sold > 0
ORDER BY total_sold DESC";

$stmt = $conn->prepare($query);
$stmt->bind_param('s', $month);
$stmt->execute();
$result = $stmt->get_result();

if(isset($_GET['download'])) {
    // Excel export logic
    header('Content-Type: application/vnd.ms-excel');
    header('Content-Disposition: attachment;filename="laporan_bulanan_' . $month . '.xls"');
    header('Cache-Control: max-age=0');
    
    echo "Laporan Bulanan Produk - " . date('F Y') . "\n\n";
    echo "Nama Produk\tJumlah Terjual\tTotal Pendapatan\n";
    
    while ($row = $result->fetch_assoc()) {
        echo $row['name'] . "\t";
        echo $row['total_sold'] . "\t";
        echo "Rp " . number_format($row['total_income'], 0, ',', '.') . "\n";
    }
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Bulanan Produk - <?php echo date('F Y'); ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        @media print {
            .no-print {
                display: none;
            }
            .table {
                width: 100%;
                margin-bottom: 1rem;
                border-collapse: collapse;
            }
            .table th,
            .table td {
                padding: 0.75rem;
                border: 1px solid #000;
            }
        }
    </style>
</head>
<body>
    <div class="container mt-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Laporan Bulanan Produk - <?php echo date('F Y'); ?></h2>
            <div class="no-print">
                <button onclick="window.print()" class="btn btn-primary">Print</button>
                <a href="?download=1" class="btn btn-success">Download Excel</a>
                <a href="transaction_history.php" class="btn btn-secondary">Kembali</a>
            </div>
        </div>

        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>No</th>
                    <th>Nama Produk</th>
                    <th>Jumlah Terjual</th>
                    <th>Total Pendapatan</th>
                </tr>
            </thead>
            <tbody>
                <?php 
                $no = 1;
                $total_income = 0;
                while ($row = $result->fetch_assoc()): 
                    $total_income += $row['total_income'];
                ?>
                <tr>
                    <td><?php echo $no++; ?></td>
                    <td><?php echo $row['name']; ?></td>
                    <td><?php echo $row['total_sold']; ?></td>
                    <td>Rp <?php echo number_format($row['total_income'], 0, ',', '.'); ?></td>
                </tr>
                <?php endwhile; ?>
                <tr class="table-primary">
                    <td colspan="3" class="text-end fw-bold">Total Pendapatan:</td>
                    <td class="fw-bold">Rp <?php echo number_format($total_income, 0, ',', '.'); ?></td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>
<?php
$stmt->close();
$conn->close();
?>
