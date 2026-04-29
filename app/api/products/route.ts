import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// GET all products (public)
export async function GET() {
  try {
    const result = await db.select().from(products).orderBy(products.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal memuat produk' }, { status: 500 });
  }
}

// POST create product (admin only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, price, stock, image } = body;

    const result = await db
      .insert(products)
      .values({ name, price: String(price), stock: Number(stock), image })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal menambah produk' }, { status: 500 });
  }
}
