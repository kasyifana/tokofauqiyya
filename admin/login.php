<?php
session_start();
if(isset($_SESSION['admin'])) {
    header("Location: panel.php");
    exit();
}

if($_SERVER['REQUEST_METHOD'] == 'POST') {
    $username = $_POST['username'];
    $password = $_POST['password'];
    $loginType = $_POST['login_type'];

    if($loginType === 'admin') {
        // Admin login
        if($username === 'admin' && $password === 'admin') {
            $_SESSION['admin'] = true;
            header("Location: panel.php");
            exit();
        } else {
            $error = "Username atau password salah!";
        }
    } else {
        // Employee login
        if($username === 'karyawan' && $password === 'karyawan') { // Ganti dengan kredensial yang sesuai
            $_SESSION['employee'] = true;
            $_SESSION['expire'] = time() + (24 * 60 * 60); // 24 jam
            header("Location: transaction_employee.php");
            exit();
        } else {
            $error = "Username atau password salah!";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Admin - Toko Fauqiyya</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .navbar-brand img {
            max-width: 120px;
            height: auto;
        }
        @media (max-width: 768px) {
            .navbar-brand img {
                max-width: 100px;
            }
            .container.mt-5 {
                margin-top: 2rem !important;
            }
            .card {
                margin: 0 10px;
            }
        }
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container-fluid">
            <a class="navbar-brand" href="/index.html">
                <img src="/assets/img/logo.png" alt="Toko Fauqiyya">
            </a>
        </div>
    </nav>
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-12 col-md-6 col-lg-5">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h4>Login Admin</h4>
                    </div>
                    <div class="card-body">
                        <?php if(isset($error)) { ?>
                            <div class="alert alert-danger"><?php echo $error; ?></div>
                        <?php } ?>
                        <form method="POST">
                            <div class="mb-3">
                                <label>Username</label>
                                <input type="text" name="username" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label>Password</label>
                                <input type="password" name="password" class="form-control" required>
                            </div>
                            <div class="d-flex gap-2">
                                <button type="submit" name="login_type" value="admin" class="btn btn-primary">Login Admin</button>
                                <button type="submit" name="login_type" value="employee" class="btn btn-success">Login Karyawan</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>