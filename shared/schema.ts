import { pgTable, text, serial, integer, boolean, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Enums
export const propertyTypeEnum = pgEnum("property_type", [
  "residential_single_family", 
  "residential_condo", 
  "residential_townhouse", 
  "commercial_office", 
  "commercial_retail", 
  "commercial_industrial", 
  "land"
]);

export const propertyTypeGroupEnum = pgEnum("property_type_group", [
  "residential", 
  "commercial", 
  "land", 
  "other"
]);

export const transactionTypeEnum = pgEnum("transaction_type", ["sale", "lease", "other"]);

export const commissionStatusEnum = pgEnum("commission_status", ["pending", "paid", "overdue"]);

// Tables
export const brokers = pgTable("brokers", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  propertyType: propertyTypeEnum("property_type").notNull(),
  propertyTypeGroup: propertyTypeGroupEnum("property_type_group").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  transactionType: transactionTypeEnum("transaction_type").notNull(),
  transactionDate: timestamp("transaction_date").notNull(),
  transactionAmount: decimal("transaction_amount", { precision: 12, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  totalCommission: decimal("total_commission", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commissions = pgTable("commissions", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").references(() => transactions.id).notNull(),
  brokerId: integer("broker_id").references(() => brokers.id).notNull(),
  splitPercentage: decimal("split_percentage", { precision: 5, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: commissionStatusEnum("status").notNull(),
  notes: text("notes"),
  paymentDate: timestamp("payment_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const brokersRelations = relations(brokers, ({ many }) => ({
  commissions: many(commissions),
}));

export const propertiesRelations = relations(properties, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  property: one(properties, {
    fields: [transactions.propertyId],
    references: [properties.id],
  }),
  commissions: many(commissions),
}));

export const commissionsRelations = relations(commissions, ({ one }) => ({
  transaction: one(transactions, {
    fields: [commissions.transactionId],
    references: [transactions.id],
  }),
  broker: one(brokers, {
    fields: [commissions.brokerId],
    references: [brokers.id],
  }),
}));

// Zod Schemas
export const brokerInsertSchema = createInsertSchema(brokers, {
  firstName: (schema) => schema.min(2, "First name must be at least 2 characters"),
  lastName: (schema) => schema.min(2, "Last name must be at least 2 characters"),
  email: (schema) => schema.email("Must provide a valid email"),
  username: (schema) => schema.min(4, "Username must be at least 4 characters"),
  password: (schema) => schema.min(8, "Password must be at least 8 characters"),
});

export const propertyInsertSchema = createInsertSchema(properties, {
  address: (schema) => schema.min(5, "Address must be at least 5 characters"),
  city: (schema) => schema.min(2, "City must be at least 2 characters"),
  state: (schema) => schema.min(2, "State must be at least 2 characters"),
  zipCode: (schema) => schema.min(5, "Zip code must be at least 5 characters"),
});

export const transactionInsertSchema = createInsertSchema(transactions, {
  transactionAmount: (schema) => schema.min(0, "Transaction amount must be greater than or equal to 0"),
  commissionRate: (schema) => schema.min(0, "Commission rate must be greater than or equal to 0"),
  totalCommission: (schema) => schema.min(0, "Total commission must be greater than or equal to 0"),
});

export const commissionInsertSchema = createInsertSchema(commissions, {
  splitPercentage: (schema) => schema.min(0, "Split percentage must be greater than or equal to 0").max(100, "Split percentage must be less than or equal to 100"),
  amount: (schema) => schema.min(0, "Amount must be greater than or equal to 0"),
});

// Types
export type Broker = typeof brokers.$inferSelect;
export type BrokerInsert = z.infer<typeof brokerInsertSchema>;

export type Property = typeof properties.$inferSelect;
export type PropertyInsert = z.infer<typeof propertyInsertSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type TransactionInsert = z.infer<typeof transactionInsertSchema>;

export type Commission = typeof commissions.$inferSelect;
export type CommissionInsert = z.infer<typeof commissionInsertSchema>;

// Extended types with relations
export type CommissionWithDetails = Commission & {
  transaction: Transaction & {
    property: Property;
  };
  broker: Broker;
};

export type TransactionWithDetails = Transaction & {
  property: Property;
  commissions: Commission[];
};
