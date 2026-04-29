import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const download = searchParams.get('download');

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const month = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const monthLabel = `${BULAN[now.getMonth()]} ${now.getFullYear()}`;

  try {
    const { sql } = await import('@/lib/db');
    const rows = await sql`
      SELECT 
        p.name,
        SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END) as total_sold,
        SUM(CASE WHEN t.type = 'out' THEN t.quantity * p.price ELSE 0 END) as total_income
      FROM products p
      LEFT JOIN transactions t ON p.id = t.product_id 
        AND TO_CHAR(t.date, 'YYYY-MM') = ${month}
      GROUP BY p.id, p.name
      HAVING SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END) > 0
      ORDER BY total_sold DESC
    `;

    if (download === '1') {
      let csv = `Laporan Bulanan Produk - ${monthLabel}\n\n`;
      csv += `Nama Produk\tJumlah Terjual\tTotal Pendapatan\n`;
      let totalIncome = 0;
      for (const row of rows as Record<string, unknown>[]) {
        const income = Number(row.total_income);
        totalIncome += income;
        csv += `${row.name}\t${row.total_sold}\tRp ${income.toLocaleString('id-ID')}\n`;
      }
      csv += `\nTotal\t\tRp ${totalIncome.toLocaleString('id-ID')}`;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel',
          'Content-Disposition': `attachment; filename="laporan_bulanan_${month}.xls"`,
        },
      });
    }

    return NextResponse.json({ rows, monthLabel, month });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal memuat laporan bulanan' }, { status: 500 });
  }
}
