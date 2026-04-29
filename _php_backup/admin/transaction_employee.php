<?php
session_start();
// Check if employee is logged in and session not expired
if(!isset($_SESSION['employee']) || time() > $_SESSION['expire']) {
    session_destroy();
    header("Location: login.php");
    exit();
}

// Database connection
require '../db.php';

// Fetch products for dropdown
$query = "SELECT * FROM products WHERE stock > 0";
$result = mysqli_query($conn, $query);
$products = [];
while($row = mysqli_fetch_assoc($result)) {
    $products[] = $row;
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transaksi - Toko Fauqiyya</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />
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
            .table td, .table th {
                min-width: 100px;
            }
        }
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">
                <img src="/assets/img/logo.png" alt="Toko Fauqiyya" style="max-width: 120px;">
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="logout.php">Logout</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <div class="row">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">Transaksi Barang Keluar</h5>
                    </div>
                    <div class="card-body">
                        <form id="transactionForm">
                            <div class="row g-2">
                                <div class="col-md-6">
                                    <select name="product_id" class="form-select product-select" required>
                                        <option value="">Pilih Produk</option>
                                        <?php foreach($products as $product): ?>
                                        <option value="<?= $product['id'] ?>" data-stock="<?= $product['stock'] ?>" data-price="<?= $product['price'] ?>" data-name="<?= $product['name'] ?>">
                                            <?= $product['name'] ?> (Stok: <?= $product['stock'] ?>)
                                        </option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <input type="number" name="quantity" class="form-control" placeholder="Jumlah" min="1" required>
                                </div>
                                <div class="col-md-3">
                                    <button type="button" class="btn btn-primary w-100" id="addItem">Tambah</button>
                                </div>
                            </div>
                        </form>

                        <div id="transactionList" class="mt-4">
                            <h5>Daftar Transaksi Saat Ini</h5>
                            <div class="table-responsive">
                                <table class="table table-bordered">
                                    <thead>
                                        <tr>
                                            <th>Produk</th>
                                            <th>Jumlah</th>
                                            <th>Subtotal</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody></tbody>
                                    <tfoot>
                                        <tr>
                                            <td colspan="2" class="text-end"><strong>Total:</strong></td>
                                            <td colspan="2" id="totalPrice">Rp 0</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <button type="button" class="btn btn-success" id="finishTransaction" style="display: none;">
                                Selesaikan Transaksi
                            </button>
                        </div>

                        <!-- Alert Transaksi -->
                        <div id="transactionAlert" class="alert alert-success mt-3" style="display: none;">
                            <div id="alertContent"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
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

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
    <script>
    $(document).ready(function() {
        $('.product-select').select2();
        let items = [];
        let totalPrice = 0;
        const transactionModal = new bootstrap.Modal(document.getElementById('transactionModal'));
        
        function updatePrice() {
            var selectedOption = $('.product-select option:selected');
            var quantity = $('input[name="quantity"]').val();
            var price = selectedOption.data('price');
            var stock = selectedOption.data('stock');
            
            if(quantity > stock) {
                alert('Jumlah melebihi stok yang tersedia!');
                $('input[name="quantity"]').val(stock);
                quantity = stock;
            }
            
            var total = price * quantity;
            $('input[name="total_price"]').val(total);
        }

        $('#addItem').click(function() {
            const selectedOption = $('.product-select option:selected');
            const quantity = parseInt($('input[name="quantity"]').val());
            const price = parseFloat(selectedOption.data('price'));
            const productId = selectedOption.val();
            const productName = selectedOption.data('name');
            const stock = parseInt(selectedOption.data('stock'));

            if (!productId || !quantity) {
                alert('Pilih produk dan jumlah terlebih dahulu!');
                return;
            }

            if (quantity > stock) {
                alert('Jumlah melebihi stok yang tersedia!');
                return;
            }

            items.push({
                product_id: productId,
                name: productName,
                quantity: quantity,
                price: price,
                total: price * quantity
            });

            updateTransactionList();
            $('#transactionForm')[0].reset();
            $('.product-select').val('').trigger('change');
        });

        // Define removeItem function first
        window.removeItem = function(index) {
            items.splice(index, 1);
            updateTransactionList();
        };

        function updateTransactionList() {
            const tbody = $('#transactionList tbody');
            tbody.empty();
            totalPrice = 0;
            
            items.forEach((item, index) => {
                tbody.append(`
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>Rp ${new Intl.NumberFormat('id-ID').format(item.total)}</td>
                        <td>
                            <button class="btn btn-danger btn-sm" onclick="removeItem(${index})">Hapus</button>
                        </td>
                    </tr>
                `);
                totalPrice += item.total;
            });
            
            $('#totalPrice').text('Rp ' + new Intl.NumberFormat('id-ID').format(totalPrice));
            $('#finishTransaction').toggle(items.length > 0);
        }

        $('#finishTransaction').click(function() {
            const modalContent = $('#modalContent');
            modalContent.html(`
                <table class="table">
                    <tr>
                        <td><strong>Total:</strong></td>
                        <td>Rp ${new Intl.NumberFormat('id-ID').format(totalPrice)}</td>
                    </tr>
                </table>
            `);
            transactionModal.show();
        });

        $('#modalPaymentAmount').on('input', function() {
            const payment = parseFloat(this.value) || 0;
            const change = payment - totalPrice;
            $('#modalChangeAmount').text('Rp ' + new Intl.NumberFormat('id-ID').format(Math.max(0, change)));
        });

        $('#confirmTransaction').click(function() {
            const payment = parseFloat($('#modalPaymentAmount').val()) || 0;
            if (payment < totalPrice) {
                alert('Pembayaran kurang dari total harga!');
                return;
            }

            const btnConfirm = $(this);
            btnConfirm.prop('disabled', true).text('Menyimpan...');

            $.ajax({
                url: 'process_transaction.php',
                method: 'POST',
                dataType: 'json',
                data: {
                    items: JSON.stringify(items),
                    transaction_type: 'out',
                    payment_amount: payment
                },
                success: function(response) {
                    if(response.success) {
                        const change = payment - totalPrice;
                        let message = '<p>Total: Rp ' + new Intl.NumberFormat('id-ID').format(totalPrice) + '</p>';
                        message += '<p>Uang Pembeli: Rp ' + new Intl.NumberFormat('id-ID').format(payment) + '</p>';
                        message += '<p>Kembalian: Rp ' + new Intl.NumberFormat('id-ID').format(Math.max(0, change)) + '</p>';
                        
                        transactionModal.hide();
                        $('#alertContent').html(message);
                        $('#transactionAlert').show();
                        
                        setTimeout(() => {
                            window.location.reload();
                        }, 3000);
                    } else {
                        alert(response.message || 'Terjadi kesalahan saat memproses transaksi');
                    }
                },
                error: function(xhr, status, error) {
                    console.error(xhr.responseText);
                    alert('Terjadi kesalahan sistem: ' + error);
                },
                complete: function() {
                    btnConfirm.prop('disabled', false).text('Konfirmasi');
                }
            });
        });
    });
    </script>
</body>
</html>
