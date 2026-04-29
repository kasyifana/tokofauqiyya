<?php
session_start();
if(!isset($_SESSION['admin'])) {
    header("Location: login.php");
    exit();
}

require '../db.php';

$period = $_GET['period'] ?? 'day';

switch($period) {
    case 'day':
        $start_date = date('Y-m-d');
        $end_date = date('Y-m-d');
        $filename = 'transaksi_' . date('Y-m-d');
        break;
    case 'week':
        $start_date = date('Y-m-d', strtotime('monday this week'));
        $end_date = date('Y-m-d', strtotime('sunday this week'));
        $filename = 'transaksi_minggu_' . date('W_Y');
        break;
    case 'month':
        $start_date = date('Y-m-01');
        $end_date = date('Y-m-t');
        $filename = 'transaksi_bulan_' . date('m_Y');
        break;
    case 'year':
        $start_date = date('Y-01-01');
        $end_date = date('Y-12-31');
        $filename = 'transaksi_tahun_' . date('Y');
        break;
}

$query = "SELECT t.*, p.name, p.price
          FROM transactions t
          JOIN products p ON t.product_id = p.id 
          WHERE DATE(t.date) BETWEEN '$start_date' AND '$end_date'
          ORDER BY date ASC";

$transactions = $conn->query($query);

// Tambahkan array nama hari dan bulan setelah query
$hari = array(
    'Sunday' => 'Minggu',
    'Monday' => 'Senin',
    'Tuesday' => 'Selasa',
    'Wednesday' => 'Rabu',
    'Thursday' => 'Kamis',
    'Friday' => 'Jumat',
    'Saturday' => 'Sabtu'
);

$bulan = array(
    '01' => 'Januari',
    '02' => 'Februari',
    '03' => 'Maret',
    '04' => 'April',
    '05' => 'Mei',
    '06' => 'Juni',
    '07' => 'Juli',
    '08' => 'Agustus',
    '09' => 'September',
    '10' => 'Oktober',
    '11' => 'November',
    '12' => 'Desember'
);

// Change the headers for PDF-like display
header('Content-Type: text/html');
header('Content-Disposition: inline; filename="' . $filename . '.html"');
?>
<html>
<head>
    <title><?= $filename ?></title>
    <style>
        @media print {
            body { margin: 0.5cm; }
        }
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 21cm;
            margin: 1cm auto;
            padding: 1cm;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 18px;
        }
        .header p {
            margin: 5px 0;
        }
        table { 
            border-collapse: collapse; 
            width: 100%;
            margin-top: 20px;
        }
        th, td { 
            border: 1px solid #000; 
            padding: 8px;
            font-size: 14px;
        }
        th { 
            background-color: #f0f0f0; 
        }
        .total { 
            font-weight: bold; 
        }
        @media print {
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>LAPORAN TRANSAKSI TOKO FAUQIYYA</h1>
        <p>Periode: <?= $start_date ?> s/d <?= $end_date ?></p>
    </div>

    <button class="no-print" onclick="window.print()" style="margin-bottom: 10px;">Print</button>

    <table>
        <tr>
            <th>No</th>
            <th>Produk</th>
            <th>Jenis</th>
            <th>Jumlah</th>
            <th>Harga</th>
            <th>Total</th>
            <th>Tanggal</th>
        </tr>
        <?php
        $total_balance = 0;
        while($row = $transactions->fetch_assoc()) {
            $total = $row['quantity'] * $row['price'];
            if($row['type'] == 'out') {
                $total_balance += $total;
            }
            
            $tanggal = strtotime($row['date']);
            $nama_hari = $hari[date('l', $tanggal)];
            $nama_bulan = $bulan[date('m', $tanggal)];
            $format_tanggal = $nama_hari . ', ' . date('d', $tanggal) . ' ' . $nama_bulan . ' ' . date('Y H:i', $tanggal);
            ?>
            <tr>
                <td><?= $row['id'] ?></td>
                <td><?= $row['name'] ?></td>
                <td><?= ($row['type'] == 'in' ? 'Masuk' : 'Keluar') ?></td>
                <td><?= $row['quantity'] ?></td>
                <td><?= $row['price'] ?></td>
                <td><?= $total ?></td>
                <td><?= $format_tanggal ?></td>
            </tr>
            <?php
        }
        ?>
        <tr class="total">
            <td colspan="5" align="right">Total Saldo:</td>
            <td><?= $total_balance ?></td>
            <td></td>
        </tr>
    </table>
</body>
</html>
<?php
exit();
