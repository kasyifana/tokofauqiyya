'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Package, ShoppingBag, History, LogOut } from 'lucide-react';

const navItems = [
  { href: '/admin/panel', icon: Package, label: 'Produk' },
  { href: '/admin/transaction', icon: ShoppingBag, label: 'Transaksi' },
  { href: '/admin/transaction-history', icon: History, label: 'Riwayat' },
];

export default function AdminNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 shadow-lg bg-gradient-to-r from-slate-900 to-blue-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[70px] gap-4">
          {/* Logo */}
          <Link href="/admin/panel" className="flex items-center gap-4 flex-shrink-0">
            <Image
              src="/assets/img/logo.png"
              alt="Fauqiyya"
              width={160}
              height={56}
              className="w-32 sm:w-40 h-auto object-contain brightness-200 invert opacity-90"
            />
            <span className="text-white/30 text-sm hidden sm:block">|</span>
            <span className="text-white/60 text-xs font-semibold tracking-wide hidden sm:block">ADMIN</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1 flex-1 justify-center">
            {navItems.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13.5px] font-medium transition-all duration-150 ${
                    active
                      ? 'bg-white/15 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={15} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 text-sm transition-all duration-150 flex-shrink-0"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
