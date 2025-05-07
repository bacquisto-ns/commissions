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

    console.log("Creating organizations...");
    const existingOrganizations = await db.select().from(schema.organizations);
    if (existingOrganizations.length === 0) {
      const organizations = [
        {
          name: "TechCorp Inc.",
          address: "100 Innovation Way",
          city: "San Francisco",
          state: "CA",
          zipCode: "94107",
          contactName: "David Chen",
          contactEmail: "dchen@techcorp.com",
          contactPhone: "415-555-7890",
        },
        {
          name: "Healthcare Partners",
          address: "450 Medical Plaza",
          city: "Chicago",
          state: "IL",
          zipCode: "60601",
          contactName: "Maria Sanchez",
          contactEmail: "msanchez@hcpartners.org",
          contactPhone: "312-555-1234",
        },
        {
          name: "Retail Solutions Group",
          address: "789 Market Street",
          city: "Boston",
          state: "MA",
          zipCode: "02110",
          contactName: "John Miller",
          contactEmail: "jmiller@retailsolutions.com",
          contactPhone: "617-555-3456",
        },
        {
          name: "Financial Services LLC",
          address: "222 Wall Street",
          city: "New York",
          state: "NY",
          zipCode: "10005",
          contactName: "Patricia Wong",
          contactEmail: "pwong@finservices.com",
          contactPhone: "212-555-8901",
        },
        {
          name: "Education First Academy",
          address: "1250 Learning Avenue",
          city: "Austin",
          state: "TX",
          zipCode: "78701",
          contactName: "Robert Johnson",
          contactEmail: "rjohnson@edufirst.edu",
          contactPhone: "512-555-6789",
        },
      ];

      await db.insert(schema.organizations).values(organizations);
    }

    // Get seeded organizations
    const seededOrganizations = await db.select().from(schema.organizations);
    
    console.log("Creating benefit programs...");
    const existingPrograms = await db.select().from(schema.benefitPrograms);
    if (existingPrograms.length === 0 && seededOrganizations.length > 0) {
      const now = new Date();
      const startDates = [
        new Date(now.getFullYear() - 1, 0, 1), // Jan 1, Last Year
        new Date(now.getFullYear() - 1, 3, 1), // Apr 1, Last Year
        new Date(now.getFullYear() - 1, 5, 1), // Jun 1, Last Year
        new Date(now.getFullYear() - 1, 8, 1), // Sep 1, Last Year
        new Date(now.getFullYear() - 1, 10, 1), // Nov 1, Last Year
      ];
      
      const endDates = [
        new Date(now.getFullYear() + 1, 0, 1), // Jan 1, Next Year
        new Date(now.getFullYear() + 1, 3, 1), // Apr 1, Next Year
        new Date(now.getFullYear() + 1, 5, 1), // Jun 1, Next Year
        new Date(now.getFullYear() + 1, 8, 1), // Sep 1, Next Year
        new Date(now.getFullYear() + 1, 10, 1), // Nov 1, Next Year
      ];
      
      const benefitPrograms = [
        {
          organizationId: seededOrganizations[0].id,
          programName: "TechCorp HSA Plan",
          programType: schema.benefitProgramTypeEnum.enumValues[0], // "hsa"
          programGroup: schema.benefitProgramGroupEnum.enumValues[0], // "health"
          participantMinimum: 10,
          startDate: startDates[0],
          endDate: endDates[0],
          notes: "Tech industry HSA plan with high participation",
        },
        {
          organizationId: seededOrganizations[0].id,
          programName: "TechCorp Dental Plan",
          programType: schema.benefitProgramTypeEnum.enumValues[3], // "dental"
          programGroup: schema.benefitProgramGroupEnum.enumValues[0], // "health"
          participantMinimum: 5,
          startDate: startDates[0],
          endDate: endDates[0],
          notes: "Comprehensive dental plan for employees",
        },
        {
          organizationId: seededOrganizations[1].id,
          programName: "Healthcare Partners FSA",
          programType: schema.benefitProgramTypeEnum.enumValues[1], // "fsa"
          programGroup: schema.benefitProgramGroupEnum.enumValues[0], // "health"
          participantMinimum: 15,
          startDate: startDates[1],
          endDate: endDates[1],
          notes: "Healthcare-focused FSA with dependent care option",
        },
        {
          organizationId: seededOrganizations[2].id,
          programName: "Retail Solutions COBRA",
          programType: schema.benefitProgramTypeEnum.enumValues[2], // "cobra"
          programGroup: schema.benefitProgramGroupEnum.enumValues[0], // "health"
          participantMinimum: 8,
          startDate: startDates[2],
          endDate: endDates[2],
          notes: "COBRA administration for retail employees",
        },
        {
          organizationId: seededOrganizations[3].id,
          programName: "Financial Services 401k",
          programType: schema.benefitProgramTypeEnum.enumValues[5], // "retirement"
          programGroup: schema.benefitProgramGroupEnum.enumValues[1], // "retirement"
          participantMinimum: 50,
          startDate: startDates[3],
          endDate: endDates[3],
          notes: "Retirement planning for financial sector",
        },
        {
          organizationId: seededOrganizations[4].id,
          programName: "Education First Vision",
          programType: schema.benefitProgramTypeEnum.enumValues[4], // "vision"
          programGroup: schema.benefitProgramGroupEnum.enumValues[0], // "health"
          participantMinimum: 25,
          startDate: startDates[4],
          endDate: endDates[4],
          notes: "Vision coverage for education staff",
        },
        {
          organizationId: seededOrganizations[4].id,
          programName: "Education First Life Insurance",
          programType: schema.benefitProgramTypeEnum.enumValues[6], // "life_insurance"
          programGroup: schema.benefitProgramGroupEnum.enumValues[3], // "insurance"
          participantMinimum: 30,
          startDate: startDates[4],
          endDate: endDates[4],
          notes: "Life insurance for faculty and staff",
        },
      ];

      await db.insert(schema.benefitPrograms).values(benefitPrograms);
    }

    // Get seeded brokers and benefit programs
    const seededBrokers = await db.select().from(schema.brokers);
    const seededPrograms = await db.select().from(schema.benefitPrograms);

    // Create transactions and commissions if they don't exist
    const existingTransactions = await db.select().from(schema.transactions);
    if (existingTransactions.length === 0 && seededPrograms.length > 0) {
      console.log("Creating transactions and commissions...");

      // Create transaction dates 
      const now = new Date();
      const dates = [
        new Date(now.getFullYear(), now.getMonth() - 1, 12), // Last month, 12th
        new Date(now.getFullYear(), now.getMonth() - 1, 5),  // Last month, 5th
        new Date(now.getFullYear(), now.getMonth() - 2, 29), // Two months ago, 29th
        new Date(now.getFullYear(), now.getMonth() - 2, 21), // Two months ago, 21st
        new Date(now.getFullYear(), now.getMonth() - 2, 18), // Two months ago, 18th
      ];

      // Transactions
      const transactions = [
        {
          benefitProgramId: seededPrograms[0].id,
          transactionType: schema.transactionTypeEnum.enumValues[0], // "enrollment"
          transactionDate: dates[0],
          participantCount: 450,
          commissionRate: "2.00",
          totalCommission: "900.00",
          notes: "Annual HSA enrollment for TechCorp",
        },
        {
          benefitProgramId: seededPrograms[2].id,
          transactionType: schema.transactionTypeEnum.enumValues[0], // "enrollment"
          transactionDate: dates[1],
          participantCount: 320,
          commissionRate: "2.00",
          totalCommission: "640.00",
          notes: "Healthcare Partners FSA enrollment",
        },
        {
          benefitProgramId: seededPrograms[3].id,
          transactionType: schema.transactionTypeEnum.enumValues[2], // "adjustment"
          transactionDate: dates[2],
          participantCount: 85,
          commissionRate: "2.00",
          totalCommission: "170.00",
          notes: "COBRA participants adjustment",
        },
        {
          benefitProgramId: seededPrograms[4].id,
          transactionType: schema.transactionTypeEnum.enumValues[0], // "enrollment"
          transactionDate: dates[3],
          participantCount: 275,
          commissionRate: "2.00",
          totalCommission: "550.00",
          notes: "401k enrollment period",
        },
        {
          benefitProgramId: seededPrograms[5].id,
          transactionType: schema.transactionTypeEnum.enumValues[1], // "renewal"
          transactionDate: dates[4],
          participantCount: 180,
          commissionRate: "2.00",
          totalCommission: "360.00",
          notes: "Vision plan renewal",
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
            amount: "450.00",
            status: schema.commissionStatusEnum.enumValues[1], // "approved"
            paymentDate: new Date(dates[0].getFullYear(), dates[0].getMonth(), dates[0].getDate() + 15),
            updatedAt: new Date(),
          },
          {
            transactionId: insertedTransactions[0].id,
            brokerId: seededBrokers[1].id, // James Wilson
            splitPercentage: "50.00",
            amount: "450.00",
            status: schema.commissionStatusEnum.enumValues[1], // "approved"
            paymentDate: new Date(dates[0].getFullYear(), dates[0].getMonth(), dates[0].getDate() + 15),
            updatedAt: new Date(),
          },
          {
            transactionId: insertedTransactions[1].id,
            brokerId: seededBrokers[0].id, // Sarah Johnson
            splitPercentage: "60.00",
            amount: "384.00",
            status: schema.commissionStatusEnum.enumValues[0], // "pending"
            paymentDate: null,
            updatedAt: new Date(),
          },
          {
            transactionId: insertedTransactions[1].id,
            brokerId: seededBrokers[2].id, // Emily Parker
            splitPercentage: "40.00",
            amount: "256.00",
            status: schema.commissionStatusEnum.enumValues[0], // "pending"
            paymentDate: null,
            updatedAt: new Date(),
          },
          {
            transactionId: insertedTransactions[2].id,
            brokerId: seededBrokers[0].id, // Sarah Johnson
            splitPercentage: "75.00",
            amount: "127.50",
            status: schema.commissionStatusEnum.enumValues[1], // "approved"
            paymentDate: new Date(dates[2].getFullYear(), dates[2].getMonth(), dates[2].getDate() + 20),
            updatedAt: new Date(),
          },
          {
            transactionId: insertedTransactions[2].id,
            brokerId: seededBrokers[3].id, // Michael Chang
            splitPercentage: "25.00",
            amount: "42.50",
            status: schema.commissionStatusEnum.enumValues[1], // "approved"
            paymentDate: new Date(dates[2].getFullYear(), dates[2].getMonth(), dates[2].getDate() + 20),
            updatedAt: new Date(),
          },
          {
            transactionId: insertedTransactions[3].id,
            brokerId: seededBrokers[0].id, // Sarah Johnson
            splitPercentage: "50.00",
            amount: "275.00",
            status: schema.commissionStatusEnum.enumValues[0], // "pending"
            paymentDate: null,
            updatedAt: new Date(),
          },
          {
            transactionId: insertedTransactions[3].id,
            brokerId: seededBrokers[4].id, // Lisa Rodriguez
            splitPercentage: "50.00",
            amount: "275.00",
            status: schema.commissionStatusEnum.enumValues[0], // "pending"
            paymentDate: null,
            updatedAt: new Date(),
          },
          {
            transactionId: insertedTransactions[4].id,
            brokerId: seededBrokers[0].id, // Sarah Johnson
            splitPercentage: "60.00",
            amount: "216.00",
            status: schema.commissionStatusEnum.enumValues[1], // "approved"
            paymentDate: new Date(dates[4].getFullYear(), dates[4].getMonth(), dates[4].getDate() + 25),
            updatedAt: new Date(),
          },
          {
            transactionId: insertedTransactions[4].id,
            brokerId: seededBrokers[5].id, // Robert Kim
            splitPercentage: "40.00",
            amount: "144.00",
            status: schema.commissionStatusEnum.enumValues[1], // "approved"
            paymentDate: new Date(dates[4].getFullYear(), dates[4].getMonth(), dates[4].getDate() + 25),
            updatedAt: new Date(),
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
