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
      // Validation schema for the entire payload using the new product-based structure
      const createCommissionSchema = z.object({
        property: z.object({
          address: z.string().min(5, "Address must be at least 5 characters"),
          city: z.string().min(2, "City must be at least 2 characters"),
          state: z.string().min(2, "State must be at least 2 characters"),
          zipCode: z.string().min(5, "Zip code must be at least 5 characters"),
          propertyTypeGroup: z.string(),
        }),
        transaction: z.object({
          transactionType: transactionInsertSchema.shape.transactionType,
          transactionDate: z.coerce.date(),
          notes: z.string().optional(),
        }),
        productDetails: z.array(
          z.object({
            productId: z.string(),
            productName: z.string(),
            participantCount: z.union([
              z.string(),
              z.number().transform(n => n.toString())
            ]),
            commissionRate: z.union([
              z.string(),
              z.number().transform(n => n.toString())
            ]),
            transactionAmount: z.union([
              z.string(),
              z.number().transform(n => n.toString())
            ]),
            commissions: z.array(
              z.object({
                brokerId: z.number().int().positive(),
                splitPercentage: z.union([
                  z.string(),
                  z.number().transform(n => n.toString())
                ]),
                status: z.string().default("pending"),
                notes: z.string().optional(),
              })
            ).min(1, "At least one commission split is required"),
          })
        ).min(1, "At least one product detail is required"),
      });
      
      const validatedData = createCommissionSchema.parse(req.body);
      
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
      
      // Process each product detail as a separate commission entry
      const results = [];
      
      for (const productDetail of validatedData.productDetails) {
        // Use productId as the benefit program type
        // Ensure it's a valid enum value by casting
        const programType = productDetail.productId as "hsa" | "fsa" | "cobra" | "dental" | "vision" | "retirement" | "life_insurance" | "disability" | "other";
        
        // Parse string values to numbers for calculations
        const participantCount = parseInt(productDetail.participantCount);
        const commissionRate = parseFloat(productDetail.commissionRate);
        const transactionAmount = parseFloat(productDetail.transactionAmount);
        
        const benefitProgram = {
          programName: `${productDetail.productName} Program`,
          programType: programType,
          programGroup: validatedData.property.propertyTypeGroup as "health" | "wellness" | "retirement" | "insurance" | "other",
          participantMinimum: participantCount,
          startDate: validatedData.transaction.transactionDate,
          endDate: null as Date | null,
          notes: validatedData.transaction.notes || null
        };
        
        // Prepare commission data with proper null handling
        // Filter out zero percentage splits
        const commissionData = productDetail.commissions
          .filter(commission => {
            // Parse splitPercentage to a number for comparison
            const splitPct = parseFloat(commission.splitPercentage);
            return splitPct > 0;
          })
          .map(commission => {
            const splitPct = parseFloat(commission.splitPercentage);
            return {
              brokerId: commission.brokerId,
              splitPercentage: commission.splitPercentage,
              status: "pending" as "pending" | "paid" | "overdue", // Type assertion for TypeScript
              notes: commission.notes || null,
              amount: ((splitPct / 100) * transactionAmount).toString()
            };
          });
        
        if (commissionData.length === 0) {
          // Ensure at least one commission entry
          commissionData.push({
            brokerId: productDetail.commissions[0].brokerId,
            splitPercentage: "100",
            status: "pending" as "pending" | "paid" | "overdue",
            notes: null,
            amount: transactionAmount.toString()
          });
        }
        
        // Create the transaction and commissions
        const result = await storage.createCommission({
          organization: organization,
          benefitProgram: benefitProgram,
          transaction: {
            transactionType: validatedData.transaction.transactionType,
            transactionDate: validatedData.transaction.transactionDate,
            participantCount: participantCount, // Use the parsed number
            commissionRate: productDetail.commissionRate, // Already a string
            notes: validatedData.transaction.notes || null,
            totalCommission: transactionAmount.toString(), // Use the transaction amount as the commission
          },
          commissions: commissionData,
        });
        
        results.push(result);
      }
      
      // Return the first result (or we could return all of them)
      return res.status(201).json(results[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", JSON.stringify(error.errors, null, 2));
        console.error("Request body:", JSON.stringify(req.body, null, 2));
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
