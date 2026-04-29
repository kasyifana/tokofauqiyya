'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { Plus, Minus, Check, Trash2, LogOut, ShoppingCart, Droplets, Wallet, CreditCard, QrCode, Search } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: string;
  stock: number;
  image: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function POSTransactionPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  // Checkout states
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'qris'>('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (msg: string, t: 'success' | 'error' = 'success') => {
    setToast(msg); setToastType(t);
    setTimeout(() => setToast(''), 3000);
  };

  const loadProducts = useCallback(async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data.filter((p: Product) => p.stock > 0));
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`Stok ${product.name} habis!`, 'error');
          return prev;
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item; // Handled by remove
        if (newQty > item.product.stock) {
          showToast(`Maksimal stok tersedia: ${item.product.stock}`, 'error');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    if(confirm('Hapus semua item di keranjang?')) setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => total + (Number(item.product.price) * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  const processTransaction = async () => {
    if (paymentMethod === 'cash') {
      const payment = Number(paymentAmount);
      if (payment < cartTotal) { showToast('Uang tunai kurang dari total!', 'error'); return; }
    }

    setProcessing(true);
    try {
      const items = cart.map(i => ({
        product_id: i.product.id,
        name: i.product.name,
        quantity: i.quantity,
        price: Number(i.product.price),
        type: 'out'
      }));

      const res = await fetch('/api/transactions/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.success) {
        if (paymentMethod === 'cash') {
          const change = Math.max(0, Number(paymentAmount) - cartTotal);
          showToast(`Berhasil! Kembalian: Rp ${change.toLocaleString('id-ID')}`);
        } else {
          showToast(`Pembayaran ${paymentMethod.toUpperCase()} berhasil diproses!`);
        }
        setCart([]); setPaymentAmount(''); setShowModal(false); setPaymentMethod('cash');
        await loadProducts();
      } else {
        showToast(data.error || 'Gagal memproses', 'error');
      }
    } catch { showToast('Terjadi kesalahan', 'error'); }
    finally { setProcessing(false); }
  };

  const fmt = (n: number | string) => Number(n).toLocaleString('id-ID');
  const imgSrc = (image: string | null) =>
    image ? (image.startsWith('http') ? image : `/assets/img/${image}`) : null;

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden">
      {/* Navbar POS */}
      <header className="flex-shrink-0 z-50 shadow-lg bg-gradient-to-r from-slate-900 to-blue-950">
        <div className="px-4 sm:px-6 h-[76px] flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Image
              src="/assets/img/logo.png"
              alt="Fauqiyya"
              width={180}
              height={62}
              className="w-36 sm:w-44 h-auto object-contain brightness-200 invert opacity-90"
            />
            <div className="h-10 w-px bg-white/20 hidden sm:block"></div>
            <div className="hidden sm:block">
              <p className="text-white font-bold text-[13px] leading-none tracking-wide">KASIR KARYAWAN</p>
              <p className="text-blue-300 text-[10px] mt-1 uppercase tracking-widest font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Sistem Penjualan (POS)
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="flex items-center gap-2 text-white/70 hover:text-white bg-white/5 hover:bg-red-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border border-white/10 hover:border-red-500/30"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Tutup Kasir</span>
          </button>
        </div>
      </header>

      {/* Main POS Workspace */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT: Product Grid */}
        <section className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
          {/* Search bar */}
          <div className="px-6 py-5 flex-shrink-0">
            <div className="relative max-w-lg">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 bg-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Droplets size={48} className="mb-4 opacity-20" />
                <p className="font-semibold text-lg">Produk tidak ditemukan</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredProducts.map((p) => {
                  const inCart = cart.find(c => c.product.id === p.id)?.quantity || 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="relative bg-white rounded-3xl border-2 border-transparent hover:border-blue-400 p-3 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-200 text-left group flex flex-col h-full active:scale-95"
                    >
                      {inCart > 0 && (
                        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center z-10 shadow-lg shadow-blue-500/40 border-2 border-white">
                          {inCart}
                        </div>
                      )}
                      
                      <div className="w-full h-32 sm:h-40 rounded-2xl bg-gradient-to-b from-blue-50 to-slate-50 flex items-center justify-center overflow-hidden mb-3">
                        {imgSrc(p.image) ? (
                          <img src={imgSrc(p.image)!} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <Droplets size={32} className="text-blue-200" />
                        )}
                      </div>
                      
                      <div className="flex flex-col flex-1">
                        <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 mb-1 group-hover:text-blue-700 transition-colors">{p.name}</p>
                        <div className="mt-auto pt-2">
                          <p className="text-blue-600 font-extrabold text-lg">Rp {fmt(p.price)}</p>
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Stok: {p.stock}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT: Cart Panel */}
        <section className="w-full lg:w-[400px] xl:w-[450px] flex-shrink-0 bg-white border-l border-slate-200 flex flex-col h-[50vh] lg:h-full z-10 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)]">
          
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <ShoppingCart size={22} className="text-blue-600" />
              Pesanan
            </h2>
            <button 
              onClick={clearCart} 
              disabled={cart.length === 0}
              className="text-xs font-bold text-red-500 hover:text-red-700 disabled:opacity-30 transition-colors uppercase tracking-widest flex items-center gap-1"
            >
              <Trash2 size={14} /> Kosongkan
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-2 py-2 bg-slate-50/50">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ShoppingCart size={48} className="mb-4 opacity-20" />
                <p className="font-semibold text-base">Keranjang kosong</p>
                <p className="text-xs mt-1">Klik produk di sebelah kiri</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.product.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-colors">
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{item.product.name}</p>
                      <p className="text-blue-600 font-extrabold text-sm mt-0.5">Rp {fmt(Number(item.product.price) * item.quantity)}</p>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                      <button 
                        onClick={() => item.quantity > 1 ? updateQuantity(item.product.id, -1) : removeFromCart(item.product.id)}
                        className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-blue-50 active:scale-90 transition-all"
                      >
                        {item.quantity === 1 ? <Trash2 size={16} className="text-red-500" /> : <Minus size={16} />}
                      </button>
                      <span className="w-6 text-center font-extrabold text-slate-900 text-base">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-blue-50 active:scale-90 transition-all"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout Footer */}
          <div className="bg-white border-t border-slate-200 p-6 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] z-20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Tagihan</span>
              <span className="text-3xl font-black text-blue-700">Rp {fmt(cartTotal)}</span>
            </div>
            <button
              onClick={() => setShowModal(true)}
              disabled={cart.length === 0}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-lg flex items-center justify-center gap-3 shadow-xl shadow-blue-500/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none"
            >
              <ShoppingCart size={22} />
              BAYAR SEKARANG ({cartCount} item)
            </button>
          </div>

        </section>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-slide-up pointer-events-none">
          <div className={`text-white text-sm font-bold px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 ${toastType === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>
            {toast}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up flex flex-col">
            
            <div className="px-8 py-6 bg-gradient-to-r from-slate-900 to-blue-950 text-white">
              <h3 className="text-2xl font-black tracking-tight">Proses Pembayaran</h3>
              <p className="text-blue-200 text-sm mt-1 font-medium">Pilih metode dan selesaikan transaksi</p>
            </div>

            <div className="p-8">
              <div className="bg-blue-50/50 rounded-2xl p-5 border-2 border-blue-100 mb-6 flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Total</span>
                <span className="text-4xl font-black text-blue-700">Rp {fmt(cartTotal)}</span>
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">Metode Pembayaran</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'cash', label: 'Tunai', icon: Wallet, color: 'emerald' },
                    { id: 'transfer', label: 'Transfer', icon: CreditCard, color: 'blue' },
                    { id: 'qris', label: 'QRIS', icon: QrCode, color: 'purple' }
                  ].map((method) => {
                    const active = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => { setPaymentMethod(method.id as any); setPaymentAmount(''); }}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${
                          active 
                            ? `border-${method.color}-500 bg-${method.color}-50 text-${method.color}-700 shadow-md shadow-${method.color}-500/20` 
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <method.icon size={28} className={active ? '' : 'opacity-60'} />
                        <span className="font-extrabold text-[13px] mt-2">{method.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Cash Input */}
              {paymentMethod === 'cash' && (
                <div className="space-y-4 animate-fade-in bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Uang Diterima</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">Rp</span>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="0"
                        className="w-full pl-14 pr-5 py-4 border-2 border-slate-300 rounded-2xl text-2xl font-black text-slate-900 placeholder-slate-300 bg-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                  </div>
                  
                  {/* Quick amounts */}
                  <div className="flex gap-2">
                    {[50000, 100000, cartTotal].map((amt, i) => (
                      <button 
                        key={i}
                        onClick={() => setPaymentAmount(String(amt))}
                        className="flex-1 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:border-blue-400 hover:text-blue-600 transition-colors"
                      >
                        {amt === cartTotal ? 'Uang Pas' : `${amt / 1000}k`}
                      </button>
                    ))}
                  </div>

                  {paymentAmount && Number(paymentAmount) >= cartTotal && (
                    <div className="bg-emerald-500 rounded-2xl px-5 py-4 flex justify-between items-center text-white shadow-lg shadow-emerald-500/30 animate-slide-up">
                      <span className="font-bold text-[11px] uppercase tracking-widest opacity-90">Kembalian</span>
                      <span className="font-black text-2xl">Rp {fmt(Math.max(0, Number(paymentAmount) - cartTotal))}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setShowModal(false)} 
                  className="w-1/3 py-4 rounded-2xl border-2 border-slate-200 text-slate-500 font-extrabold hover:bg-slate-50 transition-colors active:scale-95"
                >
                  BATAL
                </button>
                <button
                  onClick={processTransaction}
                  disabled={processing}
                  className={`flex-1 py-4 rounded-2xl text-white font-black text-lg flex items-center justify-center gap-2 shadow-xl transition-all duration-200 active:scale-[0.98] ${
                    processing ? 'opacity-70 cursor-not-allowed' : ''
                  } ${
                    paymentMethod === 'cash' 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/30' 
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 shadow-blue-500/30'
                  }`}
                >
                  {processing ? <><div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" /> PROSES...</> : <><Check size={24} /> SELESAI TRANSAKSI</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
