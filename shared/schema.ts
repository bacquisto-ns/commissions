import { pgTable, text, serial, integer, boolean, timestamp, decimal, pgEnum, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "system_admin",
  "agency_admin",
  "broker"
]);

// User status enum
export const userStatusEnum = pgEnum("user_status", [
  "active",
  "inactive",
  "pending"
]);

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  role: userRoleEnum("role").default("broker").notNull(),
  status: userStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const benefitProgramTypeEnum = pgEnum("benefit_program_type", [
  "hsa",
  "fsa",
  "cobra",
  "hra",
  "consolidated_billing",
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

export const commissionStatusEnum = pgEnum("commission_status", ["pending", "approved"]);

export const commissionStructureTypeEnum = pgEnum("commission_structure_type", [
  "flat_rate",
  "per_participant",
  "tiered_participant",
  "percentage"
]);

// User role enum is defined at the top of the file

// Tables
export const agencies = pgTable("agencies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  website: text("website"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const brokers = pgTable("brokers", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number"),
  agencyId: integer("agency_id").references(() => agencies.id),
  // Temporarily commenting out the role field until we've migrated the database
  // role: userRoleEnum("role").default("broker").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  participantMinimum: integer("participant_minimum").default(0).notNull(),
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
  brokerId: integer("broker_id").references(() => brokers.id),
  splitPercentage: decimal("split_percentage", { precision: 5, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: commissionStatusEnum("status").notNull(),
  notes: text("notes"),
  paymentDate: timestamp("payment_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Commission Structures table for different commission calculation methods
export const commissionStructures = pgTable("commission_structures", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  structureType: commissionStructureTypeEnum("structure_type").notNull(),
  // Store the structure configuration as JSON
  // For flat_rate: { rate: 500.00 }
  // For per_participant: { ratePerParticipant: 2.00 }
  // For tiered_participant: { tiers: [{ min: 0, max: 100, rate: 1.50 }, { min: 101, max: 500, rate: 2.00 }, ...] }
  // For percentage: { percentage: 5.00 }
  configData: text("config_data").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Products table for managing product catalog
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  // Default commission rate for backward compatibility
  defaultCommissionRate: decimal("default_commission_rate", { precision: 10, scale: 2 }).notNull(),
  // Reference to the commission structure for advanced calculations
  commissionStructureId: integer("commission_structure_id").references(() => commissionStructures.id),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Relations
export const agenciesRelations = relations(agencies, ({ many }) => ({
  brokers: many(brokers),
}));

export const brokersRelations = relations(brokers, ({ many, one }) => ({
  commissions: many(commissions),
  agency: one(agencies, {
    fields: [brokers.agencyId],
    references: [agencies.id],
  }),
}));

export const commissionStructuresRelations = relations(commissionStructures, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  commissionStructure: one(commissionStructures, {
    fields: [products.commissionStructureId],
    references: [commissionStructures.id],
  }),
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

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  // Potential future relations
}));

// Zod Schemas
export const userInsertSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
  email: (schema) => schema.email("Must provide a valid email"),
  firstName: (schema) => schema.min(1, "First name is required"),
  lastName: (schema) => schema.min(1, "Last name is required"),
});

export const agencyInsertSchema = createInsertSchema(agencies, {
  name: (schema) => schema.min(2, "Agency name must be at least 2 characters"),
  contactEmail: (schema) => schema.email("Must provide a valid email").optional(),
  contactName: (schema) => schema.min(2, "Contact name must be at least 2 characters").optional(),
});

export const brokerInsertSchema = createInsertSchema(brokers, {
  firstName: (schema) => schema.min(2, "First name must be at least 2 characters"),
  lastName: (schema) => schema.min(2, "Last name must be at least 2 characters"),
  email: (schema) => schema.email("Must provide a valid email"),
  username: (schema) => schema.min(4, "Username must be at least 4 characters"),
  password: (schema) => schema.min(8, "Password must be at least 8 characters"),
  agencyId: (schema) => schema.optional(),
  // Temporarily removed role field
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
  participantMinimum: (schema) => schema.min(0, "Minimum participants must be greater than or equal to 0"),
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

export const commissionStructureInsertSchema = createInsertSchema(commissionStructures, {
  name: (schema) => schema.min(2, "Structure name must be at least 2 characters"),
  description: (schema) => schema.optional(),
  configData: (schema) => schema.refine(
    (data) => {
      try {
        JSON.parse(data);
        return true;
      } catch {
        return false;
      }
    },
    {
      message: "Config data must be valid JSON",
    }
  ),
});

export const productInsertSchema = createInsertSchema(products, {
  name: (schema) => schema.min(2, "Product name must be at least 2 characters"),
  code: (schema) => schema.min(2, "Product code must be at least 2 characters"),
  defaultCommissionRate: (schema) => schema.min(0, "Commission rate must be at least 0"),
  commissionStructureId: (schema) => schema.optional(),
});

// Types
export type Agency = typeof agencies.$inferSelect;
export type AgencyWithBrokerCount = Agency & { brokerCount?: number };
export type AgencyInsert = z.infer<typeof agencyInsertSchema>;

export type User = typeof users.$inferSelect;
export type UserInsert = z.infer<typeof userInsertSchema>;

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

export type CommissionStructure = typeof commissionStructures.$inferSelect;
export type CommissionStructureInsert = z.infer<typeof commissionStructureInsertSchema>;

export type Product = typeof products.$inferSelect;
export type ProductInsert = z.infer<typeof productInsertSchema>;

// Extended types with relations
export type BrokerWithAgency = Broker & {
  agency?: Agency | null;
};

export type CommissionWithDetails = Commission & {
  transaction: Transaction & {
    benefitProgram: BenefitProgram & {
      organization: Organization;
    };
  };
  broker?: Broker | null;
};

export type TransactionWithDetails = Transaction & {
  benefitProgram: BenefitProgram & {
    organization: Organization;
  };
  commissions: Commission[];
};

export type ProductWithCommissionStructure = Product & {
  commissionStructure?: CommissionStructure | null;
};
