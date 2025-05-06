import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { format } from "date-fns";

async function seed() {
  try {
    console.log("🌱 Seeding database...");

    console.log("Creating brokers...");
    const existingBrokers = await db.select().from(schema.brokers);
    if (existingBrokers.length === 0) {
      const brokers = [
        {
          username: "sarahjohnson",
          password: "password123",
          firstName: "Sarah",
          lastName: "Johnson",
          email: "sarah.johnson@example.com",
          phoneNumber: "555-123-4567",
          active: true,
        },
        {
          username: "jameswilson",
          password: "password123",
          firstName: "James",
          lastName: "Wilson",
          email: "james.wilson@example.com",
          phoneNumber: "555-987-6543",
          active: true,
        },
        {
          username: "emilyparker",
          password: "password123",
          firstName: "Emily",
          lastName: "Parker",
          email: "emily.parker@example.com",
          phoneNumber: "555-456-7890",
          active: true,
        },
        {
          username: "michaelchang",
          password: "password123",
          firstName: "Michael",
          lastName: "Chang",
          email: "michael.chang@example.com",
          phoneNumber: "555-234-5678",
          active: true,
        },
        {
          username: "lisarodriguez",
          password: "password123",
          firstName: "Lisa",
          lastName: "Rodriguez",
          email: "lisa.rodriguez@example.com",
          phoneNumber: "555-345-6789",
          active: true,
        },
        {
          username: "robertkim",
          password: "password123",
          firstName: "Robert",
          lastName: "Kim",
          email: "robert.kim@example.com",
          phoneNumber: "555-567-8901",
          active: true,
        },
      ];

      await db.insert(schema.brokers).values(brokers);
    }

    console.log("Creating properties...");
    const existingProperties = await db.select().from(schema.properties);
    if (existingProperties.length === 0) {
      const properties = [
        {
          address: "1234 Maple Avenue",
          city: "Springfield",
          state: "IL",
          zipCode: "62704",
          propertyType: "residential_single_family",
          propertyTypeGroup: "residential",
        },
        {
          address: "567 Oak Street",
          city: "Springfield",
          state: "IL",
          zipCode: "62701",
          propertyType: "residential_condo",
          propertyTypeGroup: "residential",
        },
        {
          address: "42 Commerce Way",
          city: "Springfield",
          state: "IL",
          zipCode: "62703",
          propertyType: "commercial_office",
          propertyTypeGroup: "commercial",
        },
        {
          address: "890 Pine Court",
          city: "Springfield",
          state: "IL",
          zipCode: "62702",
          propertyType: "residential_townhouse",
          propertyTypeGroup: "residential",
        },
        {
          address: "123 Hillside Drive",
          city: "Springfield",
          state: "IL",
          zipCode: "62707",
          propertyType: "land",
          propertyTypeGroup: "land",
        },
      ];

      await db.insert(schema.properties).values(properties);
    }

    // Get seeded brokers and properties
    const seededBrokers = await db.select().from(schema.brokers);
    const seededProperties = await db.select().from(schema.properties);

    // Create transactions and commissions if they don't exist
    const existingTransactions = await db.select().from(schema.transactions);
    if (existingTransactions.length === 0 && seededProperties.length > 0) {
      console.log("Creating transactions and commissions...");

      // Create transaction dates 
      const now = new Date();
      const dates = [
        new Date(now.getFullYear(), now.getMonth() - 1, 12), // Nov 12, 2023
        new Date(now.getFullYear(), now.getMonth() - 1, 5),  // Nov 5, 2023
        new Date(now.getFullYear(), now.getMonth() - 1, 29), // Oct 29, 2023
        new Date(now.getFullYear(), now.getMonth() - 2, 21), // Oct 21, 2023
        new Date(now.getFullYear(), now.getMonth() - 2, 18), // Oct 18, 2023
      ];

      // Transactions
      const transactions = [
        {
          propertyId: seededProperties[0].id,
          transactionType: "sale",
          transactionDate: dates[0],
          transactionAmount: "875000",
          commissionRate: "3.00",
          totalCommission: "26250.00",
          notes: "Successful sale with multiple offers",
        },
        {
          propertyId: seededProperties[1].id,
          transactionType: "sale",
          transactionDate: dates[1],
          transactionAmount: "425000",
          commissionRate: "3.00",
          totalCommission: "12750.00",
          notes: "First-time homebuyer",
        },
        {
          propertyId: seededProperties[2].id,
          transactionType: "lease",
          transactionDate: dates[2],
          transactionAmount: "1800000",
          commissionRate: "2.00",
          totalCommission: "36000.00",
          notes: "10-year commercial lease",
        },
        {
          propertyId: seededProperties[3].id,
          transactionType: "sale",
          transactionDate: dates[3],
          transactionAmount: "525000",
          commissionRate: "3.00",
          totalCommission: "15750.00",
          notes: "Sold in under 30 days",
        },
        {
          propertyId: seededProperties[4].id,
          transactionType: "sale",
          transactionDate: dates[4],
          transactionAmount: "350000",
          commissionRate: "3.00",
          totalCommission: "10500.00",
          notes: "Land for development",
        },
      ];

      const insertedTransactions = await db.insert(schema.transactions).values(transactions).returning();

      // Commissions
      if (seededBrokers.length > 0) {
        const commissions = [
          {
            transactionId: insertedTransactions[0].id,
            brokerId: seededBrokers[0].id, // Sarah Johnson
            splitPercentage: "50.00",
            amount: "13125.00",
            status: "paid",
            paymentDate: new Date(dates[0].getFullYear(), dates[0].getMonth(), dates[0].getDate() + 15),
          },
          {
            transactionId: insertedTransactions[0].id,
            brokerId: seededBrokers[1].id, // James Wilson
            splitPercentage: "50.00",
            amount: "13125.00",
            status: "paid",
            paymentDate: new Date(dates[0].getFullYear(), dates[0].getMonth(), dates[0].getDate() + 15),
          },
          {
            transactionId: insertedTransactions[1].id,
            brokerId: seededBrokers[0].id, // Sarah Johnson
            splitPercentage: "60.00",
            amount: "7650.00",
            status: "pending",
            paymentDate: null,
          },
          {
            transactionId: insertedTransactions[1].id,
            brokerId: seededBrokers[2].id, // Emily Parker
            splitPercentage: "40.00",
            amount: "5100.00",
            status: "pending",
            paymentDate: null,
          },
          {
            transactionId: insertedTransactions[2].id,
            brokerId: seededBrokers[0].id, // Sarah Johnson
            splitPercentage: "75.00",
            amount: "27000.00",
            status: "paid",
            paymentDate: new Date(dates[2].getFullYear(), dates[2].getMonth(), dates[2].getDate() + 20),
          },
          {
            transactionId: insertedTransactions[2].id,
            brokerId: seededBrokers[3].id, // Michael Chang
            splitPercentage: "25.00",
            amount: "9000.00",
            status: "paid",
            paymentDate: new Date(dates[2].getFullYear(), dates[2].getMonth(), dates[2].getDate() + 20),
          },
          {
            transactionId: insertedTransactions[3].id,
            brokerId: seededBrokers[0].id, // Sarah Johnson
            splitPercentage: "50.00",
            amount: "7875.00",
            status: "overdue",
            paymentDate: null,
          },
          {
            transactionId: insertedTransactions[3].id,
            brokerId: seededBrokers[4].id, // Lisa Rodriguez
            splitPercentage: "50.00",
            amount: "7875.00",
            status: "overdue",
            paymentDate: null,
          },
          {
            transactionId: insertedTransactions[4].id,
            brokerId: seededBrokers[0].id, // Sarah Johnson
            splitPercentage: "60.00",
            amount: "6300.00",
            status: "paid",
            paymentDate: new Date(dates[4].getFullYear(), dates[4].getMonth(), dates[4].getDate() + 25),
          },
          {
            transactionId: insertedTransactions[4].id,
            brokerId: seededBrokers[5].id, // Robert Kim
            splitPercentage: "40.00",
            amount: "4200.00",
            status: "paid",
            paymentDate: new Date(dates[4].getFullYear(), dates[4].getMonth(), dates[4].getDate() + 25),
          },
        ];

        await db.insert(schema.commissions).values(commissions);
      }
    }

    console.log("✅ Seed completed successfully");
  } catch (error) {
    console.error("❌ Seed failed:", error);
  }
}

seed();
