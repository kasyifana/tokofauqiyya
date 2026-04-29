import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') ?? 'week';

  const now = new Date();
  let startDate: string;
  let endDate: string;
  let filename: string;

  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (period === 'week') {
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    startDate = fmt(monday);
    endDate = fmt(sunday);
    filename = `transaksi_minggu_${startDate}`;
  } else {
    startDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    endDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(lastDay)}`;
    filename = `transaksi_bulan_${pad(now.getMonth() + 1)}_${now.getFullYear()}`;
  }

  try {
    const { sql } = await import('@/lib/db');
    const rows = await sql`
      SELECT t.*, p.name, p.price as product_price
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      WHERE DATE(t.date) BETWEEN ${startDate} AND ${endDate}
      ORDER BY t.date ASC
    `;

    const HARI: Record<number, string> = { 0: 'Minggu', 1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu' };
    const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

    let totalBalance = 0;
    let rows_html = '';

    for (const row of rows as Record<string, unknown>[]) {
      const qty = Number(row.quantity);
      const price = Number(row.product_price);
      const total = qty * price;
      if (row.type === 'out') totalBalance += total;

      const d = new Date(row.date as string);
      const tgl = `${HARI[d.getDay()]}, ${pad(d.getDate())} ${BULAN[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

      rows_html += `<tr>
        <td>${row.id}</td>
        <td>${row.name}</td>
        <td>${row.type === 'in' ? 'Masuk' : 'Keluar'}</td>
        <td>${qty}</td>
        <td>Rp ${price.toLocaleString('id-ID')}</td>
        <td>Rp ${total.toLocaleString('id-ID')}</td>
        <td>${tgl}</td>
      </tr>`;
    }

    const html = `<!DOCTYPE html>
<html><head><title>${filename}</title>
<style>
  body { font-family: Arial; max-width: 21cm; margin: 1cm auto; padding: 1cm; }
  .header { text-align: center; margin-bottom: 20px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #000; padding: 8px; font-size: 13px; }
  th { background: #f0f0f0; }
  .total { font-weight: bold; }
  @media print { .no-print { display: none; } }
</style></head>
<body>
<div class="header">
  <h1>LAPORAN TRANSAKSI TOKO FAUQIYYA</h1>
  <p>Periode: ${startDate} s/d ${endDate}</p>
</div>
<button class="no-print" onclick="window.print()" style="margin-bottom:10px;">Print</button>
<table>
  <tr><th>No</th><th>Produk</th><th>Jenis</th><th>Jumlah</th><th>Harga</th><th>Total</th><th>Tanggal</th></tr>
  ${rows_html}
  <tr class="total">
    <td colspan="5" align="right">Total Saldo:</td>
    <td>Rp ${totalBalance.toLocaleString('id-ID')}</td>
    <td></td>
  </tr>
</table>
</body></html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="${filename}.html"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal export transaksi' }, { status: 500 });
  }
}
