'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';
import { Package, Plus, Pencil, Trash2, Droplets, AlertCircle, Search, TrendingUp } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: string;
  stock: number;
  image: string | null;
}

// Reusable inline input class
const searchCls = "w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors";

export default function AdminPanelPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setProducts(await (await fetch('/api/products')).json()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus produk "${name}"?\n(Ini juga akan menghapus riwayat transaksi untuk produk ini)`)) return;
    
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('Gagal menghapus produk dari database.');
      return;
    }
    setProducts((p) => p.filter((x) => x.id !== id));
  };

  const fmt = (n: string | number) => Number(n).toLocaleString('id-ID');
  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const imgSrc = (image: string | null) =>
    image ? (image.startsWith('http') ? image : `/assets/img/${image}`) : null;

  const StockPill = ({ stock }: { stock: number }) => {
    if (stock === 0) return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-600">Habis</span>;
    if (stock <= 5) return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">{stock}</span>;
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">{stock}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Manajemen Produk</h1>
            <p className="text-slate-500 text-sm mt-0.5">{loading ? '...' : `${products.length} produk terdaftar`}</p>
          </div>
          <Link
            href="/admin/products/add"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all duration-200 active:scale-95 self-start sm:self-auto"
          >
            <Plus size={16} />
            Tambah Produk
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Produk', value: products.length, Icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Stok Tersedia', value: products.filter((p) => p.stock > 0).length, Icon: Droplets, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Stok Habis', value: products.filter((p) => p.stock === 0).length, Icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
          ].map(({ label, value, Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className={`inline-flex w-10 h-10 rounded-xl ${bg} items-center justify-center mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <p className={`text-2xl font-extrabold ${color}`}>{loading ? '–' : value}</p>
              <p className="text-slate-500 text-xs mt-0.5 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={searchCls}
              />
            </div>
            <Link
              href="/admin/transaction"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-400 text-sm font-semibold transition-all duration-150"
            >
              <TrendingUp size={14} />
              Input Transaksi
            </Link>
          </div>

          {/* Content */}
          {loading ? (
            <div className="divide-y divide-slate-50">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-10 h-10 rounded-xl animate-shimmer" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 animate-shimmer rounded-lg w-1/3" />
                    <div className="h-3 animate-shimmer rounded-lg w-1/5" />
                  </div>
                  <div className="h-7 w-20 animate-shimmer rounded-lg" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                <Package size={20} className="text-slate-300" />
              </div>
              <p className="text-slate-400 text-sm font-medium">{search ? 'Produk tidak ditemukan' : 'Belum ada produk'}</p>
              {!search && (
                <Link href="/admin/products/add" className="text-blue-600 text-sm font-semibold hover:underline mt-1.5 inline-block">
                  Tambah produk pertama →
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['#', 'Produk', 'Harga', 'Stok', ''].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product, idx) => (
                    <tr key={product.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 text-slate-400 text-xs">{idx + 1}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-blue-50 flex-shrink-0">
                            {imgSrc(product.image) ? (
                              <img src={imgSrc(product.image)!} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Droplets size={16} className="text-blue-200" />
                              </div>
                            )}
                          </div>
                          <span className="font-semibold text-slate-800 text-sm">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900 text-sm">Rp {fmt(product.price)}</td>
                      <td className="px-5 py-4"><StockPill stock={product.stock} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                          >
                            <Pencil size={12} />
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={12} />
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
