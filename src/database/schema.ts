import { pgTable, uuid, varchar, decimal, timestamp, text, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const invoiceStatusEnum = pgEnum('invoice_status', ['open', 'matched', 'paid']);
export const matchStatusEnum = pgEnum('match_status', ['proposed', 'confirmed', 'rejected']);

// Tenant table
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Vendor table
export const vendors = pgTable('vendors', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('vendors_tenant_idx').on(table.tenantId),
}));

// Invoice table
export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  vendorId: uuid('vendor_id').references(() => vendors.id, { onDelete: 'set null' }),
  invoiceNumber: varchar('invoice_number', { length: 255 }),
  amount: decimal('amount', { precision: 19, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  invoiceDate: timestamp('invoice_date'),
  description: text('description'),
  status: invoiceStatusEnum('status').default('open').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('invoices_tenant_idx').on(table.tenantId),
  vendorIdx: index('invoices_vendor_idx').on(table.vendorId),
  statusIdx: index('invoices_status_idx').on(table.status),
}));

// Bank Transaction table
export const bankTransactions = pgTable('bank_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  externalId: varchar('external_id', { length: 255 }),
  postedAt: timestamp('posted_at').notNull(),
  amount: decimal('amount', { precision: 19, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('bank_transactions_tenant_idx').on(table.tenantId),
  externalIdIdx: index('bank_transactions_external_id_idx').on(table.externalId),
}));

// Match table (single table with status)
export const matches = pgTable('matches', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  bankTransactionId: uuid('bank_transaction_id').notNull().references(() => bankTransactions.id, { onDelete: 'cascade' }),
  score: decimal('score', { precision: 5, scale: 2 }).notNull(),
  status: matchStatusEnum('status').default('proposed').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('matches_tenant_idx').on(table.tenantId),
  invoiceIdx: index('matches_invoice_idx').on(table.invoiceId),
  transactionIdx: index('matches_transaction_idx').on(table.bankTransactionId),
  statusIdx: index('matches_status_idx').on(table.status),
}));

// Idempotency table for bank transaction imports
export const idempotencyKeys = pgTable('idempotency_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  payloadHash: varchar('payload_hash', { length: 64 }).notNull(),
  result: text('result'), // JSON string of the result
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  keyIdx: index('idempotency_keys_key_idx').on(table.key),
  tenantIdx: index('idempotency_keys_tenant_idx').on(table.tenantId),
}));

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  vendors: many(vendors),
  invoices: many(invoices),
  bankTransactions: many(bankTransactions),
  matches: many(matches),
}));

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [vendors.tenantId],
    references: [tenants.id],
  }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [invoices.tenantId],
    references: [tenants.id],
  }),
  vendor: one(vendors, {
    fields: [invoices.vendorId],
    references: [vendors.id],
  }),
  matches: many(matches),
}));

export const bankTransactionsRelations = relations(bankTransactions, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [bankTransactions.tenantId],
    references: [tenants.id],
  }),
  matches: many(matches),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  tenant: one(tenants, {
    fields: [matches.tenantId],
    references: [tenants.id],
  }),
  invoice: one(invoices, {
    fields: [matches.invoiceId],
    references: [invoices.id],
  }),
  bankTransaction: one(bankTransactions, {
    fields: [matches.bankTransactionId],
    references: [bankTransactions.id],
  }),
}));

