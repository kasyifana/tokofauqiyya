import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, products } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

interface TransactionItem {
  product_id: number;
  type: 'in' | 'out';
  quantity: number;
  productName?: string;
  name?: string;
  price?: number;
  total?: number;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const items: TransactionItem[] = body.items || body.transactions;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Data transaksi tidak valid' }, { status: 400 });
    }

    let total = 0;

    for (const item of items) {
      const productId = Number(item.product_id);
      const quantity = Number(item.quantity);
      const type = item.type ?? 'out';

      // Get product
      const productRows = await db.select().from(products).where(eq(products.id, productId));
      if (!productRows.length) {
        return NextResponse.json({ error: `Produk tidak ditemukan: ID ${productId}` }, { status: 400 });
      }

      const product = productRows[0];
      const currentStock = product.stock;

      // Validate stock for outgoing
      if (type === 'out' && currentStock < quantity) {
        return NextResponse.json({ 
          error: `Stok tidak mencukupi untuk produk: ${product.name}. Stok tersedia: ${currentStock}` 
        }, { status: 400 });
      }

      // Update stock
      const newStock = type === 'in' ? currentStock + quantity : currentStock - quantity;
      await db.update(products).set({ stock: newStock }).where(eq(products.id, productId));

      // Calculate price
      const productPrice = Number(product.price);
      const transactionPrice = type === 'out' ? productPrice * quantity : 0;

      // Insert transaction
      await db.insert(transactions).values({
        productId,
        type,
        quantity,
        price: String(transactionPrice),
      });

      total += transactionPrice;
    }

    return NextResponse.json({ success: true, total });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Terjadi kesalahan' 
    }, { status: 500 });
  }
}
