import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  commissionInsertSchema, 
  commissionStatusEnum, 
  organizationInsertSchema,
  benefitProgramInsertSchema,
  transactionInsertSchema
} from "@shared/schema";

const apiPrefix = "/api";

export async function registerRoutes(app: Express): Promise<Server> {
  // --- Broker Routes ---
  
  // Get authenticated broker profile
  app.get(`${apiPrefix}/brokers/me`, async (req, res) => {
    try {
      // In a real app, this would be based on the session
      // For now we'll hardcode to the first broker (Sarah Johnson)
      const broker = await storage.getBrokerById(1);
      
      if (!broker) {
        return res.status(404).json({ message: "Broker not found" });
      }
      
      return res.json(broker);
    } catch (error) {
      console.error("Error getting broker profile:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all brokers
  app.get(`${apiPrefix}/brokers`, async (req, res) => {
    try {
      const brokers = await storage.getAllBrokers();
      return res.json(brokers);
    } catch (error) {
      console.error("Error getting all brokers:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Commission Routes ---
  
  // Get dashboard data for a broker
  app.get(`${apiPrefix}/dashboard/:brokerId`, async (req, res) => {
    try {
      const brokerId = parseInt(req.params.brokerId);
      if (isNaN(brokerId)) {
        return res.status(400).json({ message: "Invalid broker ID" });
      }
      
      const dashboardData = await storage.getDashboardData(brokerId);
      return res.json(dashboardData);
    } catch (error) {
      console.error("Error getting dashboard data:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get commissions for a broker
  app.get(`${apiPrefix}/commissions`, async (req, res) => {
    try {
      const brokerId = parseInt(req.query.brokerId as string) || 1; // Default to broker 1
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string || undefined;
      
      const commissions = await storage.getBrokerCommissions(brokerId, { limit, offset, status });
      const totalCount = await storage.getBrokerCommissionsCount(brokerId, status);
      
      return res.json({
        data: commissions,
        meta: {
          total: totalCount,
          limit,
          offset,
        },
      });
    } catch (error) {
      console.error("Error getting broker commissions:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get a single commission by ID
  app.get(`${apiPrefix}/commissions/:id`, async (req, res) => {
    try {
      const commissionId = parseInt(req.params.id);
      if (isNaN(commissionId)) {
        return res.status(400).json({ message: "Invalid commission ID" });
      }
      
      const commission = await storage.getCommissionById(commissionId);
      
      if (!commission) {
        return res.status(404).json({ message: "Commission not found" });
      }
      
      return res.json(commission);
    } catch (error) {
      console.error("Error getting commission by ID:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create a new commission (including organization, benefit program, and transaction)
  app.post(`${apiPrefix}/commissions`, async (req, res) => {
    try {
      // Validation schema for the entire payload
      const createCommissionSchema = z.object({
        property: z.object({
          address: z.string().min(5, "Address must be at least 5 characters"),
          city: z.string().min(2, "City must be at least 2 characters"),
          state: z.string().min(2, "State must be at least 2 characters"),
          zipCode: z.string().min(5, "Zip code must be at least 5 characters"),
          selectedProducts: z.array(z.string()).min(1, "At least one product must be selected"),
          propertyTypeGroup: z.string(),
        }),
        transaction: z.object({
          transactionType: transactionInsertSchema.shape.transactionType,
          transactionDate: z.coerce.date(),
          participantCount: z.coerce.number().int().positive(),
          commissionRate: z.string().or(z.number()).transform(val => 
            typeof val === 'number' ? val.toString() : val
          ),
          notes: z.string().optional(),
        }),
        commissions: z.array(z.object({
          brokerId: z.number().int().positive(),
          splitPercentage: z.string().or(z.number()).transform(val => 
            typeof val === 'number' ? val.toString() : val
          ),
          status: z.enum(['pending', 'paid', 'overdue']),
          notes: z.string().optional(),
        })),
      });
      
      const validatedData = createCommissionSchema.parse(req.body);
      
      // Calculate the total commission amount based on participant count and rate
      const participantCount = validatedData.transaction.participantCount;
      const commissionRate = parseFloat(validatedData.transaction.commissionRate.toString());
      const totalCommission = participantCount * commissionRate;
      
      // Create the organization data from property information
      const organization = {
        name: `Employer ${validatedData.property.address}`, // Use address as part of name
        address: validatedData.property.address,
        city: validatedData.property.city,
        state: validatedData.property.state,
        zipCode: validatedData.property.zipCode,
        contactName: "Contact", // Default values for now
        contactEmail: "contact@example.com", // Default values for now
        contactPhone: "" // Default values for now
      };
      
      // Convert the selected products to benefit program
      // We need to ensure the programType is one of the enum values
      const primaryProduct = validatedData.property.selectedProducts[0] as "hsa" | "fsa" | "cobra" | "dental" | "vision" | "retirement" | "life_insurance" | "disability" | "other";
      
      const benefitProgram = {
        programName: `${validatedData.property.selectedProducts.join(", ")} Program`,
        programType: primaryProduct, // Use first selected product as primary type
        programGroup: validatedData.property.propertyTypeGroup as "health" | "wellness" | "retirement" | "insurance" | "other",
        participantMinimum: participantCount, // Use participant count as minimum
        startDate: validatedData.transaction.transactionDate,
        endDate: null as Date | null,
        notes: validatedData.transaction.notes || null
      };
      
      // Prepare commission data with proper null handling
      const commissionData = validatedData.commissions.map(commission => ({
        brokerId: commission.brokerId,
        splitPercentage: commission.splitPercentage,
        status: commission.status,
        notes: commission.notes || null,
        amount: ((parseFloat(commission.splitPercentage.toString()) / 100) * totalCommission).toString()
      }));
      
      // Create the commission
      const result = await storage.createCommission({
        organization: organization,
        benefitProgram: benefitProgram,
        transaction: {
          transactionType: validatedData.transaction.transactionType,
          transactionDate: validatedData.transaction.transactionDate,
          participantCount: validatedData.transaction.participantCount,
          commissionRate: validatedData.transaction.commissionRate,
          notes: validatedData.transaction.notes || null,
          totalCommission: totalCommission.toString(),
        },
        commissions: commissionData,
      });
      
      return res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating commission:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update a commission's status
  app.patch(`${apiPrefix}/commissions/:id/status`, async (req, res) => {
    try {
      const commissionId = parseInt(req.params.id);
      if (isNaN(commissionId)) {
        return res.status(400).json({ message: "Invalid commission ID" });
      }
      
      const schema = z.object({
        status: z.enum(['pending', 'paid', 'overdue']),
        paymentDate: z.date().optional().nullable(),
      });
      
      const validatedData = schema.parse(req.body);
      
      const commission = await storage.updateCommissionStatus(
        commissionId,
        validatedData.status,
        validatedData.paymentDate
      );
      
      if (!commission) {
        return res.status(404).json({ message: "Commission not found" });
      }
      
      return res.json(commission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating commission status:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get commission statistics (by property type, by month, etc.)
  app.get(`${apiPrefix}/statistics/:brokerId`, async (req, res) => {
    try {
      const brokerId = parseInt(req.params.brokerId);
      if (isNaN(brokerId)) {
        return res.status(400).json({ message: "Invalid broker ID" });
      }
      
      const period = req.query.period as string || 'month';
      const count = parseInt(req.query.count as string) || 6;
      
      const statistics = await storage.getCommissionStatistics(brokerId, period, count);
      return res.json(statistics);
    } catch (error) {
      console.error("Error getting commission statistics:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
