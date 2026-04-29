'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';
import { ImageIcon, ArrowLeft, Package, X } from 'lucide-react';
import toast from 'react-hot-toast';

import imageCompression from 'browser-image-compression';

const inputCls = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors";

export default function AddProductPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !stock) { setError('Semua field wajib diisi'); return; }
    setError(''); setLoading(true);
    try {
      if (!confirm('Apakah Anda yakin ingin menambahkan produk ini?')) {
        setLoading(false);
        return;
      }
      
      const tid = toast.loading('Menambahkan produk...');
      try {
        let imageUrl: string | null = null;
        if (imageFile) {
          // Compress image before upload
          const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
          const compressedFile = await imageCompression(imageFile, options);
          
          const fd = new FormData();
          fd.append('image', compressedFile, imageFile.name);
          const up = await fetch('/api/upload', { method: 'POST', body: fd });
          imageUrl = up.ok ? (await up.json()).url : imageFile.name;
        }
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, price: Number(price), stock: Number(stock), image: imageUrl }),
        });
        if (res.ok) {
          toast.success('Produk berhasil ditambahkan!', { id: tid });
          router.push('/admin/panel');
        } else {
          const d = await res.json();
          toast.error(d.error || 'Gagal menyimpan', { id: tid });
          setError(d.error || 'Gagal menyimpan');
        }
      } catch {
        toast.error('Terjadi kesalahan', { id: tid });
        setError('Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };
  
    return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Back */}
        <Link href="/admin/panel" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 text-sm mb-6 transition-colors font-medium">
          <ArrowLeft size={15} />
          Kembali ke produk
        </Link>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-7 py-5 border-b border-slate-100">
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <Package size={16} className="text-blue-600" />
              </span>
              Tambah Produk Baru
            </h1>
            <p className="text-slate-500 text-sm mt-1">Isi detail produk air mineral yang akan dijual</p>
          </div>

          <form onSubmit={handleSubmit} className="p-7 space-y-6">
            {/* Image upload */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Foto Produk</label>
              <div
                onClick={() => document.getElementById('imageInput')?.click()}
                className="relative border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden cursor-pointer hover:border-blue-400 transition-colors group bg-slate-50/50"
                style={{ minHeight: 200 }}
              >
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-52 object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-semibold bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">Ganti Foto</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-red-50 transition-colors"
                    >
                      <X size={14} className="text-slate-600" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center h-52">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-3 group-hover:border-blue-200 transition-colors">
                      <ImageIcon size={24} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <p className="text-slate-600 text-sm font-semibold">Klik untuk upload foto produk</p>
                    <p className="text-slate-400 text-xs mt-1">JPG, PNG, WebP — maks. 4MB</p>
                  </div>
                )}
                <input id="imageInput" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Nama Produk <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Air Mineral Fauqiyya 600ml"
                className={inputCls}
                required
              />
            </div>

            {/* Price + Stock row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Harga <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold pointer-events-none">Rp</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    min="0"
                    className={`${inputCls} pl-11`}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Stok Awal <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  min="0"
                  className={inputCls}
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                <p className="text-red-600 text-xs font-semibold">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Link href="/admin/panel" className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 text-sm font-bold text-center hover:bg-slate-50 transition-colors">
                Batal
              </Link>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all duration-200 active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Menyimpan...</>
                ) : 'Simpan Produk'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
