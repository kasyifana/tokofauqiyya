import { pgTable, serial, varchar, numeric, integer, text, timestamp, boolean, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  price: numeric('price', { precision: 15, scale: 2 }).notNull(),
  stock: integer('stock').notNull().default(0),
  image: text('image'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id),
  type: varchar('type', { length: 3 }).notNull(),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 15, scale: 2 }).notNull().default('0'),
  date: timestamp('date', { withTimezone: true }).defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
