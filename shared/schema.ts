import { pgTable, text, serial, integer, boolean, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Enums
export const benefitProgramTypeEnum = pgEnum("benefit_program_type", [
  "hsa",
  "fsa",
  "cobra",
  "dental",
  "vision",
  "retirement",
  "life_insurance",
  "disability",
  "other"
]);

export const benefitProgramGroupEnum = pgEnum("benefit_program_group", [
  "health",
  "wellness",
  "retirement",
  "insurance",
  "other"
]);

export const transactionTypeEnum = pgEnum("transaction_type", ["enrollment", "renewal", "adjustment"]);

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

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const benefitPrograms = pgTable("benefit_programs", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  programName: text("program_name").notNull(),
  programType: benefitProgramTypeEnum("program_type").notNull(),
  programGroup: benefitProgramGroupEnum("program_group").notNull(),
  commissionPerParticipant: decimal("commission_per_participant", { precision: 8, scale: 2 }).default("2.00").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  benefitProgramId: integer("benefit_program_id").references(() => benefitPrograms.id).notNull(),
  transactionType: transactionTypeEnum("transaction_type").notNull(),
  transactionDate: timestamp("transaction_date").notNull(),
  participantCount: integer("participant_count").notNull(),
  commissionRate: decimal("commission_rate", { precision: 8, scale: 2 }).notNull(),
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

export const organizationsRelations = relations(organizations, ({ many }) => ({
  benefitPrograms: many(benefitPrograms),
}));

export const benefitProgramsRelations = relations(benefitPrograms, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [benefitPrograms.organizationId],
    references: [organizations.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  benefitProgram: one(benefitPrograms, {
    fields: [transactions.benefitProgramId],
    references: [benefitPrograms.id],
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

export const organizationInsertSchema = createInsertSchema(organizations, {
  name: (schema) => schema.min(2, "Organization name must be at least 2 characters"),
  address: (schema) => schema.min(5, "Address must be at least 5 characters"),
  city: (schema) => schema.min(2, "City must be at least 2 characters"),
  state: (schema) => schema.min(2, "State must be at least 2 characters"),
  zipCode: (schema) => schema.min(5, "Zip code must be at least 5 characters"),
  contactName: (schema) => schema.min(2, "Contact name must be at least 2 characters"),
  contactEmail: (schema) => schema.email("Must provide a valid email address"),
});

export const benefitProgramInsertSchema = createInsertSchema(benefitPrograms, {
  programName: (schema) => schema.min(2, "Program name must be at least 2 characters"),
  commissionPerParticipant: (schema) => schema.min(0, "Commission per participant must be greater than or equal to 0"),
});

export const transactionInsertSchema = createInsertSchema(transactions, {
  participantCount: (schema) => schema.min(1, "Participant count must be at least 1"),
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

export type Organization = typeof organizations.$inferSelect;
export type OrganizationInsert = z.infer<typeof organizationInsertSchema>;

export type BenefitProgram = typeof benefitPrograms.$inferSelect;
export type BenefitProgramInsert = z.infer<typeof benefitProgramInsertSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type TransactionInsert = z.infer<typeof transactionInsertSchema>;

export type Commission = typeof commissions.$inferSelect;
export type CommissionInsert = z.infer<typeof commissionInsertSchema>;

// Extended types with relations
export type CommissionWithDetails = Commission & {
  transaction: Transaction & {
    benefitProgram: BenefitProgram & {
      organization: Organization;
    };
  };
  broker: Broker;
};

export type TransactionWithDetails = Transaction & {
  benefitProgram: BenefitProgram & {
    organization: Organization;
  };
  commissions: Commission[];
};
