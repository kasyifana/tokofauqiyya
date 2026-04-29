'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';
import { ImageIcon, ArrowLeft, Pencil, X } from 'lucide-react';

import imageCompression from 'browser-image-compression';

const inputCls = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 bg-white outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-colors";

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((d) => { setName(d.name); setPrice(d.price); setStock(String(d.stock)); setCurrentImage(d.image); })
      .catch(() => setError('Gagal memuat produk'))
      .finally(() => setFetching(false));
  }, [id]);

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
    setError(''); setLoading(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        // Compress image before upload
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
        const compressedFile = await imageCompression(imageFile, options);
        
        const fd = new FormData();
        fd.append('image', compressedFile, imageFile.name);
        const up = await fetch('/api/upload', { method: 'POST', body: fd });
        imageUrl = up.ok ? (await up.json()).url : imageFile.name;
      }
      const body: Record<string, unknown> = { name, price: Number(price), stock: Number(stock) };
      if (imageUrl) body.image = imageUrl;
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) router.push('/admin/panel');
      else { const d = await res.json(); setError(d.error || 'Gagal update'); }
    } catch { setError('Terjadi kesalahan'); }
    finally { setLoading(false); }
  };

  const currentSrc = currentImage
    ? currentImage.startsWith('http') ? currentImage : `/assets/img/${currentImage}`
    : null;

  const displaySrc = imagePreview || currentSrc;

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/admin/panel" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-amber-600 text-sm mb-6 transition-colors font-medium">
          <ArrowLeft size={15} />
          Kembali ke produk
        </Link>

        {fetching ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
            <div className="inline-block w-8 h-8 border-[3px] border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm mt-3 font-medium">Memuat data produk...</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-7 py-5 border-b border-slate-100">
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                <span className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Pencil size={14} className="text-amber-600" />
                </span>
                Edit Produk
              </h1>
              <p className="text-slate-500 text-sm mt-1">Perbarui informasi produk air mineral</p>
            </div>

            <form onSubmit={handleSubmit} className="p-7 space-y-6">
              {/* Image */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Foto Produk
                </label>
                <div
                  onClick={() => document.getElementById('imageInputEdit')?.click()}
                  className="relative border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden cursor-pointer hover:border-amber-400 transition-colors group bg-slate-50/50"
                  style={{ minHeight: 200 }}
                >
                  {displaySrc ? (
                    <div className="relative">
                      <img src={displaySrc} alt="Preview" className="w-full h-52 object-cover" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-semibold bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">Ganti Foto</span>
                      </div>
                      {imagePreview && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-red-50 transition-colors"
                        >
                          <X size={14} className="text-slate-600" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center h-52">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-3 group-hover:border-amber-200 transition-colors">
                        <ImageIcon size={24} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                      </div>
                      <p className="text-slate-600 text-sm font-semibold">Klik untuk upload foto</p>
                    </div>
                  )}
                  <input id="imageInputEdit" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>
                {currentImage && !imagePreview && (
                  <p className="text-xs text-slate-400 mt-2">Foto saat ini: <span className="text-slate-600 font-semibold">{currentImage.split('/').pop()}</span></p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Harga <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold pointer-events-none">Rp</span>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min="0" className={`${inputCls} pl-11`} required />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Stok <span className="text-red-500">*</span>
                  </label>
                  <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} min="0" className={inputCls} required />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  <p className="text-red-600 text-xs font-semibold">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Link href="/admin/panel" className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 text-sm font-bold text-center hover:bg-slate-50 transition-colors">
                  Batal
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-3.5 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all duration-200 active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Menyimpan...</>
                  ) : 'Update Produk'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
