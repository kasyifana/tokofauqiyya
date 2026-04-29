'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import {
  Download, AlertTriangle, RotateCcw, Filter, X,
  TrendingUp, ShoppingBag, BarChart2
} from 'lucide-react';

interface TransactionRow {
  id: number;
  name: string;
  type: string;
  quantity: number;
  product_price: string;
  price: string;
  date: string;
  rowTotal?: number;
  runningBalance?: number | null;
}

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

const inputCls = "px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors";

export default function TransactionHistoryPage() {
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [monthlyData, setMonthlyData] = useState<{ rows: Record<string, unknown>[]; monthLabel: string } | null>(null);
  const [showMonthly, setShowMonthly] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (msg: string, t: 'success' | 'error' = 'success') => {
    setToast(msg); setToastType(t);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/transactions';
      if (startDate && endDate) url += `?start_date=${startDate}&end_date=${endDate}`;
      const res = await fetch(url);
      setRows(await res.json());
    } catch {
      showToast('Gagal memuat data', 'error');
    } finally { setLoading(false); }
  }, [startDate, endDate]);

  useEffect(() => { load(); }, []);

  const handleFilter = (e: React.FormEvent) => { e.preventDefault(); load(); };

  const handleReset = async () => {
    if (!resetPassword) { showToast('Masukkan password admin', 'error'); return; }
    setResetting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPassword }),
      });
      if (res.ok) {
        showToast('Semua transaksi berhasil direset');
        setRows([]); setShowReset(false); setResetPassword('');
      } else {
        const d = await res.json();
        showToast(d.error || 'Reset gagal', 'error');
      }
    } catch { showToast('Terjadi kesalahan', 'error'); }
    finally { setResetting(false); }
  };

  const loadMonthly = async () => {
    try {
      const res = await fetch('/api/reports/monthly');
      setMonthlyData(await res.json());
      setShowMonthly(true);
    } catch { showToast('Gagal memuat laporan', 'error'); }
  };

  const fmt = (n: number | string) => Number(n).toLocaleString('id-ID');

  let balance = 0;
  const processed = rows.map((row) => {
    const rowTotal = Number(row.quantity) * Number(row.product_price);
    if (row.type === 'out') balance += rowTotal;
    return { ...row, rowTotal, runningBalance: row.type === 'out' ? balance : null };
  });

  const totalBalance = rows.filter((r) => r.type === 'out').reduce((s, r) => s + Number(r.quantity) * Number(r.product_price), 0);
  const totalIn = rows.filter((r) => r.type === 'in').reduce((s, r) => s + Number(r.quantity), 0);
  const totalOutCount = rows.filter((r) => r.type === 'out').reduce((s, r) => s + Number(r.quantity), 0);

  const fmtDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2,'0')} ${BULAN[d.getMonth()]} ${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Riwayat Transaksi</h1>
          <p className="text-slate-500 text-sm mt-0.5">Monitor semua transaksi barang masuk dan keluar</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Pendapatan', value: `Rp ${fmt(totalBalance)}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Barang Keluar', value: `${totalOutCount} pcs`, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Barang Masuk', value: `${totalIn} pcs`, icon: BarChart2, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className={`inline-flex w-10 h-10 rounded-xl ${bg} items-center justify-center mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <p className={`text-xl font-extrabold ${color}`}>{loading ? '—' : value}</p>
              <p className="text-slate-500 text-xs mt-0.5 font-bold uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-2.5">
              <Filter size={15} className="text-slate-400" />
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
              <span className="text-slate-400 text-sm font-medium">–</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-sm">Filter</button>
              {(startDate || endDate) && (
                <button type="button" onClick={() => { setStartDate(''); setEndDate(''); setTimeout(load, 50); }} className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors">
                  Reset
                </button>
              )}
            </form>

            <div className="flex flex-wrap gap-2.5">
              <a href="/api/reports/export?period=week" target="_blank" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors">
                <Download size={14} /> Minggu Ini
              </a>
              <a href="/api/reports/export?period=month" target="_blank" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors">
                <Download size={14} /> Bulan Ini
              </a>
              <button onClick={loadMonthly} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors">
                <BarChart2 size={14} /> Laporan Bulanan
              </button>
              <button onClick={() => setShowReset(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition-colors ml-auto md:ml-0">
                <RotateCcw size={14} /> Reset
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="divide-y divide-slate-50">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-4 px-6 py-4">
                  <div className="h-4 animate-shimmer rounded-lg flex-1" />
                  <div className="h-4 animate-shimmer rounded-lg w-20" />
                  <div className="h-4 animate-shimmer rounded-lg w-16" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                <ShoppingBag size={20} className="text-slate-300" />
              </div>
              <p className="text-slate-400 text-sm font-semibold">Tidak ada data transaksi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['No', 'Produk', 'Jenis', 'Jumlah', 'Harga', 'Total', 'Saldo', 'Tanggal'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {processed.map((row, idx) => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 text-slate-400 text-xs">{idx + 1}</td>
                      <td className="px-5 py-4 font-semibold text-slate-800 text-sm">{row.name}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${row.type === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                          {row.type === 'in' ? '↑ Masuk' : '↓ Keluar'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium">{row.quantity}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">Rp {fmt(row.product_price)}</td>
                      <td className="px-5 py-4 font-bold text-slate-900 text-sm">Rp {fmt(row.rowTotal!)}</td>
                      <td className="px-5 py-4 text-slate-500 text-sm font-medium">
                        {row.runningBalance !== null ? `Rp ${fmt(row.runningBalance!)}` : '—'}
                      </td>
                      <td className="px-5 py-4 text-slate-400 whitespace-nowrap text-xs font-medium">{fmtDate(row.date)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/50">
                    <td colSpan={6} className="px-5 py-5 text-right font-bold text-slate-500 uppercase tracking-widest text-[11px]">Total Pendapatan:</td>
                    <td colSpan={2} className="px-5 py-5 font-extrabold text-blue-700 text-lg">Rp {fmt(totalBalance)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-slide-up pointer-events-none">
          <div className={`text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-2xl ${toastType === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>
            {toast}
          </div>
        </div>
      )}

      {/* Reset Modal */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowReset(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 animate-slide-up">
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mb-3">Reset Transaksi</h3>
            <div className="flex gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl mb-5">
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">
                <strong>Peringatan!</strong> Ini akan menghapus <em>seluruh</em> riwayat transaksi secara permanen dan tidak bisa dikembalikan.
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Konfirmasi Password Admin</label>
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 bg-white outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowReset(false)} className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors">Batal</button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className={`flex-1 py-3.5 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 transition-all duration-200 active:scale-[0.98] ${resetting ? 'opacity-70' : ''}`}
              >
                {resetting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Mereset...</> : <><RotateCcw size={15} />Reset Sekarang</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Report Modal */}
      {showMonthly && monthlyData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowMonthly(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-7 max-h-[85vh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Laporan Bulanan</h3>
                <p className="text-slate-500 text-sm mt-0.5 font-medium">{monthlyData.monthLabel}</p>
              </div>
              <button onClick={() => setShowMonthly(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                <X size={15} className="text-slate-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">No</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Produk</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Terjual</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pendapatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(monthlyData.rows as Record<string, unknown>[]).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 text-sm">{String(row.name)}</td>
                      <td className="px-4 py-3 text-sm">{String(row.total_sold)} pcs</td>
                      <td className="px-4 py-3 font-bold text-blue-700 text-sm">Rp {Number(row.total_income).toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex gap-3">
              <a
                href="/api/reports/monthly?download=1"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all duration-200 active:scale-[0.98]"
              >
                <Download size={16} />
                Download Excel
              </a>
              <button onClick={() => setShowMonthly(false)} className="px-6 py-3.5 rounded-2xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
