import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, transactions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// GET single product
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const result = await db.select().from(products).where(eq(products.id, Number(id)));
    if (!result.length) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memuat produk' }, { status: 500 });
  }
}

// PUT update product
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await req.json();
    const { name, price, stock, image } = body;

    const updateData: Record<string, unknown> = { name, price: String(price), stock: Number(stock) };
    if (image) updateData.image = image;

    const result = await db.update(products).set(updateData).where(eq(products.id, Number(id))).returning();
    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal update produk' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  try {
    // Soft delete product by setting isActive to false
    await db.update(products).set({ isActive: false }).where(eq(products.id, Number(id)));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal hapus produk' }, { status: 500 });
  }
}
