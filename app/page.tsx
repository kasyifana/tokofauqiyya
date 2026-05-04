'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Minus, Plus, Trash2, X, MessageCircle, Droplets, ChevronRight, Package, MapPin } from 'lucide-react';

const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER;

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

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2800);
  };

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
        const q: Record<number, number> = {};
        data.forEach((p: Product) => { q[p.id] = 1; });
        setQuantities(q);
      })
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (product: Product) => {
    const qty = quantities[product.id] || 1;
    if (qty > product.stock) { showToast('Jumlah melebihi stok tersedia'); return; }
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === product.id);
      if (ex) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { product, quantity: qty }];
    });
    setQuantities((prev) => ({ ...prev, [product.id]: 1 }));
    showToast(`${product.name} ditambahkan ke keranjang`);
  };

  const removeFromCart = (id: number) => setCart((prev) => prev.filter((i) => i.product.id !== id));
  const cartTotal = cart.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const checkout = () => {
    if (!cart.length) { showToast('Keranjang masih kosong'); return; }
    if (!customerName.trim() || !customerAddress.trim()) { showToast('Lengkapi informasi pembeli'); return; }
    let msg = 'Halo Fauqiyya, saya ingin memesan:\n\n';
    cart.forEach((i) => {
      msg += `• ${i.product.name} × ${i.quantity} = Rp ${(Number(i.product.price) * i.quantity).toLocaleString('id-ID')}\n`;
    });
    msg += `\nTotal: Rp ${cartTotal.toLocaleString('id-ID')}`;
    msg += `\n\nNama: ${customerName}\nAlamat: ${customerAddress}`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    setCart([]); setCustomerName(''); setCustomerAddress(''); setCartOpen(false);
  };

  const fmt = (n: number | string) => Number(n).toLocaleString('id-ID');
  const imgSrc = (image: string | null) =>
    image ? (image.startsWith('http') ? image : `/assets/img/${image}`) : null;

  const stockBadge = (stock: number) => {
    if (stock === 0) return { label: 'Habis', cls: 'bg-red-100 text-red-600' };
    if (stock <= 5) return { label: `Stok: ${stock}`, cls: 'bg-amber-100 text-amber-700' };
    return { label: `Stok: ${stock}`, cls: 'bg-emerald-100 text-emerald-700' };
  };

  const inputCls = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors";

  return (
    <div className="min-h-screen bg-white">

      {/* ─── NAVBAR ─── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/assets/img/logo.png" alt="Fauqiyya" width={220} height={76} className="w-36 sm:w-48 h-auto object-contain" priority />
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all duration-200 active:scale-95"
            >
              <ShoppingCart size={16} />
              <span className="hidden sm:inline">Keranjang</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
            <Link
              href="/admin/login"
              className="px-4 py-2.5 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-400 text-sm font-semibold transition-all duration-150 hidden sm:block"
            >
              Masuk
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #bfdbfe 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-blue-200/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full bg-sky-300/30 blur-2xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 relative flex flex-col sm:flex-row items-center gap-10">
          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-5">
              <Droplets size={13} className="animate-droplet" />
              Air Mineral Premium
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight mb-4">
              Hidrasi Terbaik<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">Untuk Anda</span>
            </h1>
            <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-md">
              Air mineral berkualitas tinggi dari sumber terpercaya. Segar, murni, dan menyehatkan setiap hari.
            </p>
            <button
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-7 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              Lihat Produk <ChevronRight size={16} />
            </button>
          </div>

          <div className="hidden sm:flex flex-shrink-0 items-center justify-center w-44 h-44">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-pulse" />
              <div className="absolute inset-4 rounded-full bg-blue-500/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Droplets size={72} className="text-blue-400 drop-shadow-lg animate-droplet" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRODUCTS ─── */}
      <section id="products" className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Produk Kami</h2>
            <p className="text-slate-500 text-sm mt-1">Pilih produk dan pesan langsung via WhatsApp</p>
          </div>
          {!loading && (
            <span className="text-xs text-slate-400 font-medium">{products.length} produk</span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="h-44 animate-shimmer" />
                <div className="p-4 space-y-2.5">
                  <div className="h-3.5 animate-shimmer rounded-lg w-3/4" />
                  <div className="h-3 animate-shimmer rounded-lg w-1/2" />
                  <div className="h-9 animate-shimmer rounded-xl mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Package size={28} className="text-blue-200" />
            </div>
            <p className="text-slate-400 font-medium">Belum ada produk tersedia</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {products.map((product, idx) => {
              const { label, cls } = stockBadge(product.stock);
              const src = imgSrc(product.image);
              const qty = quantities[product.id] || 1;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 animate-fade-up"
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  <div className="relative h-44 bg-gradient-to-b from-blue-50 to-slate-50 flex items-center justify-center overflow-hidden group">
                    {src ? (
                      <img src={src} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <Droplets size={44} className="text-blue-200" />
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">Stok Habis</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-slate-800 text-sm leading-snug mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-blue-600 font-extrabold text-[15px] mb-2">Rp {fmt(product.price)}</p>

                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full mb-3 ${cls}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {label}
                    </span>

                    {product.stock > 0 && (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <button
                            onClick={() => setQuantities((p) => ({ ...p, [product.id]: Math.max(1, (p[product.id] || 1) - 1) }))}
                            className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-base flex items-center justify-center transition-colors active:scale-90 border-none cursor-pointer select-none"
                          >−</button>
                          <span className="flex-1 text-center text-sm font-bold text-slate-800">{qty}</span>
                          <button
                            onClick={() => setQuantities((p) => ({ ...p, [product.id]: Math.min(product.stock, (p[product.id] || 1) + 1) }))}
                            className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-base flex items-center justify-center transition-colors active:scale-90 border-none cursor-pointer select-none"
                          >+</button>
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-semibold transition-all duration-200 active:scale-95 shadow-md shadow-blue-500/20"
                        >
                          + Tambah ke Keranjang
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── LOCATION ─── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row">
          <div className="p-8 md:w-5/12 flex flex-col justify-center bg-gradient-to-br from-slate-50 to-white">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/50 text-blue-700 text-xs font-semibold mb-5 w-fit">
              <MapPin size={13} />
              Kunjungi Toko Kami
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Lokasi Toko Fauqiyya</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Beli langsung produk air mineral Fauqiyya di toko kami untuk mendapatkan harga terbaik dan melihat langsung ketersediaan stok terbaru.
            </p>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <MapPin size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm mb-1">Pusat Distribusi Fauqiyya</p>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Perum Jl. Rambutan No.63, Pasekaran Indah,<br/>
                  Pasekaran, Kec. Batang, Kabupaten Batang,<br/>
                  Jawa Tengah 51216 (3P7J+HQ)
                </p>
                <a 
                  href="https://maps.google.com/maps?q=Perum+Jl.+Rambutan+No.63,+Pasekaran+Indah,+Pasekaran,+Kec.+Batang,+Kabupaten+Batang,+Jawa+Tengah+51216" 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Buka di Google Maps <ChevronRight size={16} />
                </a>
              </div>
            </div>
          </div>
          <div className="md:w-7/12 h-[350px] md:h-auto border-l border-slate-100 bg-slate-100 relative">
            <div className="absolute inset-0 bg-slate-200 animate-pulse" /> {/* Placeholder while loading */}
            <iframe
              src="https://maps.google.com/maps?q=Perum+Jl.+Rambutan+No.63,+Pasekaran+Indah,+Pasekaran,+Kec.+Batang,+Kabupaten+Batang,+Jawa+Tengah+51216&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 z-10"
            ></iframe>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-100 mt-12 pb-24 sm:pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Image src="/assets/img/logo.png" alt="Fauqiyya" width={160} height={56} className="w-28 sm:w-36 h-auto object-contain opacity-50" />
          <p className="text-slate-400 text-xs">© {new Date().getFullYear()} Toko Fauqiyya. Semua hak dilindungi.</p>
          <Link href="/admin/login" className="text-xs text-slate-400 hover:text-blue-600 transition-colors font-medium">Admin →</Link>
        </div>
      </footer>

      {/* ─── FLOATING CART BAR ─── */}
      {cart.length > 0 && !cartOpen && (
        <div className="fixed bottom-0 sm:bottom-6 left-0 sm:left-1/2 sm:-translate-x-1/2 w-full sm:w-[420px] z-40 px-4 sm:px-0 pb-4 sm:pb-0 animate-slide-up pointer-events-none">
          <div className="bg-slate-900 rounded-3xl shadow-2xl shadow-blue-900/20 p-4 flex items-center justify-between pointer-events-auto border border-slate-800">
            <div className="flex flex-col text-white pl-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{cartCount} Item Ditambahkan</span>
              <span className="font-black text-xl tracking-tight text-white">Rp {cartTotal.toLocaleString('id-ID')}</span>
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-extrabold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center gap-2"
            >
              Checkout <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── TOAST ─── */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-fade-in pointer-events-none">
          <div className="bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 whitespace-nowrap">
            <Droplets size={14} className="text-blue-400" />
            {toastMsg}
          </div>
        </div>
      )}

      {/* ─── CART DRAWER ─── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setCartOpen(false)} />
          <div className="relative w-full sm:max-w-md max-h-[92vh] bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <ShoppingCart size={18} className="text-blue-500" />
                  Keranjang
                </h2>
                {cart.length > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">{cartCount} item · Rp {cartTotal.toLocaleString('id-ID')}</p>
                )}
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X size={15} className="text-slate-600" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                    <ShoppingCart size={28} className="text-blue-200" />
                  </div>
                  <p className="text-slate-500 font-medium text-sm">Keranjang masih kosong</p>
                  <p className="text-slate-400 text-xs mt-1">Tambahkan produk untuk mulai belanja</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/40 transition-colors">
                      <div className="w-12 h-12 rounded-xl bg-blue-100/60 overflow-hidden flex-shrink-0">
                        {imgSrc(item.product.image) ? (
                          <img src={imgSrc(item.product.image)!} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Droplets size={16} className="text-blue-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{item.product.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Rp {fmt(item.product.price)} × {item.quantity}</p>
                        <p className="text-sm font-extrabold text-blue-600 mt-0.5">
                          Rp {(Number(item.product.price) * item.quantity).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors flex-shrink-0"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-semibold text-sm">Total Belanja</span>
                      <span className="text-blue-700 font-extrabold text-xl">Rp {cartTotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Customer form */}
                  <div className="pt-2 space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informasi Pemesan</p>
                    <input type="text" placeholder="Nama lengkap" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputCls} />
                    <textarea placeholder="Alamat lengkap pengiriman" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="px-6 py-5 border-t border-slate-100">
                <button
                  onClick={checkout}
                  className="w-full py-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-[0.98]"
                >
                  <MessageCircle size={18} />
                  Pesan via WhatsApp
                </button>
                <p className="text-center text-xs text-slate-400 mt-2.5">Anda akan diarahkan ke WhatsApp</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
