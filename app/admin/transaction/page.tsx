'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';
import { Plus, Check, X, ShoppingBag, History } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: string;
  stock: number;
}

interface TransactionItem {
  product_id: number;
  productName: string;
  type: 'in' | 'out';
  quantity: number;
  subtotal: number;
}

const inputCls = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors";

export default function TransactionPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [type, setType] = useState<'out' | 'in'>('out');
  const [quantity, setQuantity] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [showModal, setShowModal] = useState(false);
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
    setProducts(await res.json());
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const selected = products.find((p) => String(p.id) === selectedProduct);

  const addItem = () => {
    if (!selectedProduct || !quantity) { showToast('Pilih produk dan masukkan jumlah', 'error'); return; }
    const qty = Number(quantity);
    if (!selected || qty <= 0) { showToast('Jumlah tidak valid', 'error'); return; }
    if (type === 'out' && selected.stock < qty) {
      showToast(`Stok tidak mencukupi! Tersedia: ${selected.stock}`, 'error'); return;
    }
    const subtotal = type === 'out' ? Number(selected.price) * qty : 0;
    setItems((p) => [...p, { product_id: selected.id, productName: selected.name, type, quantity: qty, subtotal }]);
    setQuantity('');
    showToast('Item ditambahkan');
  };

  const removeItem = (idx: number) => setItems((p) => p.filter((_, i) => i !== idx));
  const totalPrice = items.reduce((s, i) => s + i.subtotal, 0);
  const hasOutgoing = items.some((i) => i.type === 'out');

  const processTransaction = async () => {
    if (hasOutgoing) {
      const payment = Number(paymentAmount);
      if (payment < totalPrice) { showToast('Pembayaran kurang dari total', 'error'); return; }
    }
    setProcessing(true);
    try {
      const res = await fetch('/api/transactions/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.success) {
        const payment = Number(paymentAmount) || 0;
        const change = Math.max(0, payment - data.total);
        showToast(payment > 0
          ? `Transaksi berhasil! Kembalian: Rp ${change.toLocaleString('id-ID')}`
          : 'Transaksi berhasil disimpan!');
        setItems([]); setPaymentAmount(''); setShowModal(false);
        await loadProducts();
      } else {
        showToast(data.error || 'Gagal memproses', 'error');
      }
    } catch { showToast('Terjadi kesalahan', 'error'); }
    finally { setProcessing(false); }
  };

  const fmt = (n: number) => n.toLocaleString('id-ID');

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Transaksi Admin</h1>
            <p className="text-slate-500 text-sm mt-0.5">Catat barang masuk dan keluar (Penyesuaian stok)</p>
          </div>
          <Link
            href="/admin/transaction-history"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-bold transition-colors"
          >
            <History size={15} />
            Lihat Riwayat
          </Link>
        </div>

        {/* Form Input */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
            <ShoppingBag size={16} className="text-blue-500" />
            Input Transaksi Baru
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Produk</label>
              <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className={inputCls}>
                <option value="">Pilih produk...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Jenis</label>
              <select value={type} onChange={(e) => setType(e.target.value as 'in' | 'out')} className={inputCls}>
                <option value="out">Barang Keluar</option>
                <option value="in">Barang Masuk</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Jumlah</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" min="1" className={inputCls} />
            </div>
            <div className="sm:col-span-2 flex items-end">
              <button
                onClick={addItem}
                className="w-full py-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 transition-all duration-200 active:scale-[0.98]"
              >
                <Plus size={16} /> Tambah
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        {items.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Daftar Transaksi ({items.length} item)</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Produk', 'Jenis', 'Jumlah', 'Subtotal', ''].map((h, i) => (
                      <th key={i} className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-50">
                      <td className="px-5 py-4 font-semibold text-slate-800 text-sm">{item.productName}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${item.type === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                          {item.type === 'in' ? '↑ Masuk' : '↓ Keluar'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium">{item.quantity}</td>
                      <td className="px-5 py-4 font-bold text-slate-900 text-sm">{item.type === 'out' ? `Rp ${fmt(item.subtotal)}` : '—'}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => removeItem(idx)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                          <X size={14} className="text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-50/50">
                    <td colSpan={3} className="px-5 py-4 text-right font-bold text-slate-600 text-sm">Total:</td>
                    <td colSpan={2} className="px-5 py-4 font-extrabold text-blue-700 text-lg">Rp {fmt(totalPrice)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="px-6 py-5 border-t border-slate-100">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all duration-200 active:scale-[0.98]"
              >
                <Check size={16} /> Selesaikan Transaksi
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-slide-up pointer-events-none">
          <div className={`text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-2xl ${toastType === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>
            {toast}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 animate-slide-up">
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mb-5">Konfirmasi Transaksi</h3>

            <div className="bg-blue-50 rounded-2xl p-4 mb-5 border border-blue-100">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 text-xs font-bold uppercase tracking-widest">Total transaksi</span>
                <span className="text-blue-700 font-extrabold text-xl">Rp {fmt(totalPrice)}</span>
              </div>
            </div>

            {hasOutgoing && (
              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Uang Diterima</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 placeholder-slate-400 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
                  />
                </div>
                {paymentAmount && Number(paymentAmount) >= totalPrice && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 flex justify-between items-center">
                    <span className="text-emerald-700 font-bold text-xs uppercase tracking-widest">Kembalian</span>
                    <span className="text-emerald-700 font-extrabold text-lg">Rp {fmt(Math.max(0, Number(paymentAmount) - totalPrice))}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={processTransaction}
                disabled={processing}
                className={`flex-1 py-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all duration-200 active:scale-[0.98] ${processing ? 'opacity-70' : ''}`}
              >
                {processing ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Memproses...</> : <><Check size={16} />Konfirmasi</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
