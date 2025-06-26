<?php
session_start();
if(!isset($_SESSION['admin'])) {
    header("Location: login.php");
    exit();
}

require '../db.php';

if($_SERVER['REQUEST_METHOD'] == 'POST') {
    $transactions = json_decode($_POST['transactions'], true);
    $total = 0;
    
    foreach($transactions as $trans) {
        $product_id = $trans['product_id'];
        $type = $trans['type'];
        $quantity = $trans['quantity'];
        
        // Dapatkan data produk
        $sql = "SELECT * FROM products WHERE id=$product_id";
        $result = $conn->query($sql);
        $product = $result->fetch_assoc();
        
        // Cek apakah transaksi keluar akan menyebabkan stok minus
        if($type == 'out' && ($product['stock'] - $quantity) < 0) {
            echo json_encode(['success' => false, 'message' => 'Stok tidak mencukupi!']);
            exit();
        }

        if($type == 'in') {
            $new_stock = $product['stock'] + $quantity;
            $transaction_price = 0; // Set price to 0 for incoming items
        } else {
            $new_stock = $product['stock'] - $quantity;
            $transaction_price = $product['price'] * $quantity; // Calculate price only for outgoing items
        }
        
        // Update stok
        $conn->query("UPDATE products SET stock=$new_stock WHERE id=$product_id");
        
        // Simpan transaksi dengan price
        $conn->query("INSERT INTO transactions (product_id, type, quantity, price) VALUES ($product_id, '$type', $quantity, $transaction_price)");
        
        $total += $transaction_price;
    }
    
    echo json_encode(['success' => true, 'total' => $total]);
    exit();
}

// Ambil semua transaksi
$transactions = $conn->query("SELECT transactions.*, products.name, products.price 
                             FROM transactions 
                             JOIN products ON transactions.product_id = products.id 
                             ORDER BY date DESC");
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transaksi - Toko Fauqiyya</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .table-responsive {
            margin-bottom: 1rem;
        }
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            .btn {
                margin-top: 10px;
            }
            .col-md-2, .col-md-3, .col-md-4 {
                margin-bottom: 10px;
            }
            #transactionForm .row > div {
                width: 100%;
            }
            .table td, .table th {
                min-width: 100px;
            }
            .navbar-brand {
                font-size: 1.1rem;
            }
        }
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container-fluid">
            <a class="navbar-brand" href="panel.php">Transaksi</a>
            <div class="navbar-nav">
                <a class="nav-link" href="transaction_history.php">Lihat Riwayat</a>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <h3>Transaksi Baru</h3>
        <form id="transactionForm" class="mb-4">
            <div class="row g-2">
                <div class="col-md-4">
                    <select name="product_id" class="form-select" required>
                        <option value="" disabled selected>Pilih Produk</option>
                        <?php
                        $products = $conn->query("SELECT * FROM products");
                        while($row = $products->fetch_assoc()) {
                            echo "<option value='".$row['id']."' data-price='".$row['price']."' data-stock='".$row['stock']."'>".$row['name']." (Stok: ".$row['stock'].")</option>";
                        }
                        ?>
                    </select>
                </div>
                <div class="col-md-3">
                    <select name="type" class="form-select" required>
                        <!-- <option value="">Jenis Transaksi</option> -->
                        <option value="in">Barang Masuk</option>
                        <option value="out" selected>Barang Keluar</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <input type="number" name="quantity" class="form-control" placeholder="Jumlah" required>
                </div>
                <div class="col-md-2">
                    <button type="submit" class="btn btn-primary w-100">Tambah</button>
                </div>
            </div>
        </form>

        <div id="transactionList" class="mb-4">
            <h4>Daftar Transaksi Saat Ini</h4>
            <div class="table-responsive">
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Produk</th>
                            <th>Jenis</th>
                            <th>Jumlah</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" class="text-end"><strong>Total:</strong></td>
                            <td id="totalPrice">Rp 0</td>
                        </tr>
                        <tr id="paymentRow" style="display: none;">
                            <td colspan="3" class="text-end"><strong>Uang Diterima:</strong></td>
                            <td>
                                <input type="number" id="paymentAmount" class="form-control" placeholder="Jumlah Pembayaran">
                            </td>
                        </tr>
                        <tr id="changeRow" style="display: none;">
                            <td colspan="3" class="text-end"><strong>Kembalian:</strong></td>
                            <td id="changeAmount">Rp 0</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        <button id="finishTransaction" class="btn btn-success mb-4" style="display: none;">
            Selesaikan Transaksi
        </button>

        <!-- Alert Transaksi -->
        <div id="transactionAlert" class="alert alert-success mb-4" style="display: none;" role="alert">
            <div id="alertContent"></div>
        </div>

        <!-- Modal Transaksi -->
        <div class="modal fade" id="transactionModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detail Transaksi</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div id="modalContent"></div>
                        <div id="paymentSection">
                            <div class="mb-3">
                                <label class="form-label">Uang Diterima:</label>
                                <input type="number" id="modalPaymentAmount" class="form-control">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Kembalian:</label>
                                <div id="modalChangeAmount">Rp 0</div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-primary" id="confirmTransaction">Konfirmasi</button>
                    </div>
                </div>
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
                        <th>Tanggal</th>
                    </tr>
                </thead>
                <tbody>
                    <?php while($row = $transactions->fetch_assoc()) { ?>
                    <tr>
                        <td><?php echo $row['id']; ?></td>
                        <td><?php echo $row['name']; ?></td>
                        <td><?php echo ($row['type'] == 'in') ? 'Masuk' : 'Keluar'; ?></td>
                        <td><?php echo $row['quantity']; ?></td>
                        <td>Rp <?php echo number_format($row['price'], 0, ',', '.'); ?></td>
                        <td><?php echo date('d/m/Y H:i', strtotime($row['date'])); ?></td>
                    </tr>
                    <?php } ?>
                </tbody>
            </table>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Add this code at the beginning of your script section
        document.querySelector('[name="product_id"]').addEventListener('mousedown', function(e) {
            if (this.options[0].text === 'Pilih Produk') {
                this.remove(0);
            }
        });
        
        let transactions = [];
        let totalPrice = 0;
        
        document.getElementById('transactionForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const productSelect = this.querySelector('[name="product_id"]');
            const productName = productSelect.options[productSelect.selectedIndex].text;
            const price = productSelect.options[productSelect.selectedIndex].dataset.price;
            const stock = parseInt(productSelect.options[productSelect.selectedIndex].dataset.stock);
            const type = this.querySelector('[name="type"]').value;
            const quantity = parseInt(this.querySelector('[name="quantity"]').value);

            // Validasi stok untuk transaksi keluar
            if (type === 'out') {
                if (stock === 0) {
                    alert('Stok produk kosong! Tidak bisa melakukan transaksi keluar.');
                    return;
                }
                if (stock < quantity) {
                    alert('Jumlah melebihi stok yang tersedia! Stok tersedia: ' + stock);
                    return;
                }
            }
            
            const transaction = {
                product_id: formData.get('product_id'),
                type: type,
                quantity: quantity,
                productName: productName,
                subtotal: price * quantity
            };
            
            transactions.push(transaction);
            updateTransactionList();
            this.reset();
        });
        
        const transactionModal = new bootstrap.Modal(document.getElementById('transactionModal'));
        
        document.getElementById('finishTransaction').addEventListener('click', function() {
            const modalContent = document.getElementById('modalContent');
            modalContent.innerHTML = `
                <table class="table">
                    <tr>
                        <td><strong>Total:</strong></td>
                        <td>Rp ${new Intl.NumberFormat('id-ID').format(totalPrice)}</td>
                    </tr>
                </table>
            `;
            
            const hasOutgoingItems = transactions.some(t => t.type === 'out');
            document.getElementById('paymentSection').style.display = hasOutgoingItems ? 'block' : 'none';
            
            transactionModal.show();
        });

        document.getElementById('modalPaymentAmount').addEventListener('input', function() {
            const payment = parseFloat(this.value) || 0;
            const change = payment - totalPrice;
            document.getElementById('modalChangeAmount').textContent = 
                'Rp ' + new Intl.NumberFormat('id-ID').format(Math.max(0, change));
        });

        document.getElementById('confirmTransaction').addEventListener('click', function() {
            const payment = parseFloat(document.getElementById('modalPaymentAmount').value) || 0;
            const btnConfirm = this;

            // Nonaktifkan tombol konfirmasi
            btnConfirm.disabled = true;
            btnConfirm.innerHTML = 'Menyimpan...';

            fetch('transaction.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'transactions=' + encodeURIComponent(JSON.stringify(transactions))
            })
            .then(response => response.json())
            .then(data => {
                if(data.success) {
                    const change = payment - data.total;
                    let message = '<p>Total: Rp ' + new Intl.NumberFormat('id-ID').format(data.total) + '</p>';
                    if (payment > 0) {
                        message += '<p>Uang Pembeli: Rp ' + new Intl.NumberFormat('id-ID').format(payment) + '</p>';
                        message += '<p>Kembalian: Rp ' + new Intl.NumberFormat('id-ID').format(Math.max(0, change)) + '</p>';
                    }
                    
                    // Sembunyikan modal
                    transactionModal.hide();
                    
                    // Tampilkan pesan sukses
                    const alertContent = document.getElementById('alertContent');
                    alertContent.innerHTML = message;
                    document.getElementById('transactionAlert').style.display = 'block';
                    
                    // Tunggu sebentar lalu reload dengan hard refresh
                    setTimeout(() => {
                        window.location.href = window.location.pathname + '?t=' + new Date().getTime();
                    }, 1500);
                } else {
                    alert(data.message || 'Terjadi kesalahan saat menyimpan transaksi');
                    btnConfirm.disabled = false;
                    btnConfirm.innerHTML = 'Konfirmasi';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Terjadi kesalahan: ' + error);
                btnConfirm.disabled = false;
                btnConfirm.innerHTML = 'Konfirmasi';
            });
        });

        function updateTransactionList() {
            const tbody = document.querySelector('#transactionList tbody');
            const totalElement = document.getElementById('totalPrice');
            tbody.innerHTML = '';
            totalPrice = 0;
            
            transactions.forEach(t => {
                const row = tbody.insertRow();
                row.insertCell(0).textContent = t.productName;
                row.insertCell(1).textContent = t.type === 'in' ? 'Masuk' : 'Keluar';
                row.insertCell(2).textContent = t.quantity;
                row.insertCell(3).textContent = 'Rp ' + new Intl.NumberFormat('id-ID').format(t.subtotal);
                totalPrice += t.subtotal;
            });
            
            totalElement.textContent = 'Rp ' + new Intl.NumberFormat('id-ID').format(totalPrice);
            document.getElementById('finishTransaction').style.display = transactions.length > 0 ? 'block' : 'none';
        }
    </script>
</body>
</html>