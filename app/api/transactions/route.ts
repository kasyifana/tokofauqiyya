import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';

// GET all transactions with product name
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  try {
    const sql = neon(process.env.DATABASE_URL!);

    let rows;
    if (startDate && endDate) {
      rows = await sql`
        SELECT t.*, p.name, p.price as product_price
        FROM transactions t
        JOIN products p ON t.product_id = p.id
        WHERE DATE(t.date) BETWEEN ${startDate} AND ${endDate}
        ORDER BY t.date ASC
      `;
    } else {
      rows = await sql`
        SELECT t.*, p.name, p.price as product_price
        FROM transactions t
        JOIN products p ON t.product_id = p.id
        ORDER BY t.date ASC
      `;
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal memuat transaksi' }, { status: 500 });
  }
}

// DELETE all transactions (reset)
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const adminPass = process.env.ADMIN_PASSWORD ?? 'admin';

  if (body.password !== adminPass) {
    return NextResponse.json({ error: 'Password salah' }, { status: 403 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`DELETE FROM transactions`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal reset transaksi' }, { status: 500 });
  }
}
