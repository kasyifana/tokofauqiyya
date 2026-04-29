'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, User, Eye, EyeOff, ShieldCheck, Users, Droplets, ArrowLeft } from 'lucide-react';

const inputCls = "w-full px-4 py-3 pl-11 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState<'admin' | 'employee'>('admin');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (type: 'admin' | 'employee') => {
    if (!username || !password) { setError('Username dan password harus diisi'); return; }
    setError(''); setLoading(true);
    try {
      const res = await signIn('credentials', { username, password, loginType: type, redirect: false });
      if (res?.error) setError('Username atau password salah');
      else {
        router.push(type === 'admin' ? '/admin/panel' : '/admin/transaction-employee');
        router.refresh();
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-blue-950 to-blue-800">
      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />

        <div className="relative text-center z-10">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                <Droplets size={44} className="text-blue-300 animate-droplet" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg">
                <ShieldCheck size={14} className="text-white" />
              </div>
            </div>
          </div>

          <Image src="/assets/img/logo.png" alt="Fauqiyya" width={190} height={66} className="h-14 w-auto object-contain mx-auto mb-6 brightness-200 invert opacity-90" />

          <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Dashboard Admin</h2>
          <p className="text-blue-200 text-sm leading-relaxed max-w-xs">
            Kelola produk, pantau transaksi, dan lihat laporan penjualan dengan mudah.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3 max-w-xs mx-auto">
            {[
              { label: 'Produk', desc: 'CRUD & stok' },
              { label: 'Transaksi', desc: 'Masuk & keluar' },
              { label: 'Laporan', desc: 'Bulanan & export' },
              { label: 'Karyawan', desc: 'Multi role' },
            ].map((f) => (
              <div key={f.label} className="bg-white/8 border border-white/10 rounded-2xl p-3 text-left backdrop-blur-sm">
                <p className="text-white font-semibold text-sm">{f.label}</p>
                <p className="text-blue-300 text-xs mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right login form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Image src="/assets/img/logo.png" alt="Fauqiyya" width={160} height={56} className="h-12 w-auto object-contain brightness-200 invert opacity-90" />
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl p-7 shadow-2xl">
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Selamat datang</h1>
              <p className="text-slate-500 text-sm mt-1">Masuk ke panel manajemen Fauqiyya</p>
            </div>

            {/* Tab toggle */}
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl mb-6">
              {([
                { type: 'admin', label: 'Admin', Icon: ShieldCheck },
                { type: 'employee', label: 'Karyawan', Icon: Users },
              ] as const).map(({ type, label, Icon }) => (
                <button
                  key={type}
                  onClick={() => { setLoginType(type); setError(''); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    loginType === type ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Username</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin(loginType)}
                    placeholder={loginType === 'admin' ? 'admin' : 'karyawan'}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin(loginType)}
                    placeholder="••••••••"
                    className={`${inputCls} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  <p className="text-red-600 text-xs font-semibold">{error}</p>
                </div>
              )}

              {/* Button */}
              <button
                onClick={() => handleLogin(loginType)}
                disabled={loading}
                className={`w-full py-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold mt-2 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Masuk...
                  </>
                ) : `Masuk sebagai ${loginType === 'admin' ? 'Admin' : 'Karyawan'}`}
              </button>
            </div>
          </div>

          <div className="text-center mt-5">
            <Link href="/" className="inline-flex items-center gap-1.5 text-blue-200 hover:text-white text-sm transition-colors font-medium">
              <ArrowLeft size={14} />
              Kembali ke toko
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
