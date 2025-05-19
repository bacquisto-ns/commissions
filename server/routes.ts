import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { pool } from "../db";
import { 
  commissionInsertSchema, 
  commissionStatusEnum, 
  organizationInsertSchema,
  benefitProgramInsertSchema,
  transactionInsertSchema,
  productInsertSchema,
  commissionStructureInsertSchema
} from "@shared/schema";
import { authenticate, authorizeAdmin, authorize } from "./middleware/auth";
import authRoutes from "./auth-routes";
import importRoutes from "./import-routes";
import fs from "fs";
import path from "path";

const apiPrefix = "/api";

export async function registerRoutes(app: Express): Promise<Server> {
  // Use our auth routes
  app.use(`${apiPrefix}/auth`, authRoutes);
  
  // Register import routes
  app.use(`${apiPrefix}/import`, importRoutes);
  
  // Create upload directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'temp/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // --- Broker Routes ---
  
  // Get authenticated broker profile
  app.get(`${apiPrefix}/brokers/me`, async (req, res) => {
    try {
      // In a real app, this would be based on the session
      // For now we'll hardcode to the first broker (Sarah Johnson, ID 7)
      const broker = await storage.getBrokerById(7);
      
      if (!broker) {
        return res.status(404).json({ message: "Broker not found" });
      }
      
      // Manually add role for now
      // This will be coming from the database once we've migrated
      const brokerWithRole = {
        ...broker,
        role: "broker"
      };
      
      return res.json(brokerWithRole);
    } catch (error) {
      console.error("Error getting broker profile:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get broker by ID
  app.get(`${apiPrefix}/brokers/:id`, async (req, res) => {
    try {
      const brokerId = parseInt(req.params.id);
      if (isNaN(brokerId)) {
        return res.status(400).json({ message: "Invalid broker ID" });
      }
      
      const broker = await storage.getBrokerById(brokerId);
      
      if (!broker) {
        return res.status(404).json({ message: "Broker not found" });
      }
      
      return res.json(broker);
    } catch (error) {
      console.error("Error getting broker by ID:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update broker
  app.patch(`${apiPrefix}/brokers/:id`, async (req, res) => {
    try {
      const brokerId = parseInt(req.params.id);
      if (isNaN(brokerId)) {
        return res.status(400).json({ message: "Invalid broker ID" });
      }
      
      // Define schema for broker update
      const schema = z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phoneNumber: z.string().optional(),
        agencyId: z.union([z.number(), z.string(), z.null()]).optional(),
        active: z.boolean().optional()
      });
      
      const validatedData = schema.parse(req.body);
      console.log("Validated data for broker update:", validatedData);
      
      // Process agencyId if provided
      let processedAgencyId = null;
      if (validatedData.agencyId && validatedData.agencyId !== 'null') {
        processedAgencyId = typeof validatedData.agencyId === 'string' 
          ? parseInt(validatedData.agencyId) 
          : validatedData.agencyId;
        
        // Verify that the agency exists if an ID is provided
        if (processedAgencyId) {
          const agency = await storage.getAgencyById(processedAgencyId);
          if (!agency) {
            return res.status(400).json({ message: `Agency with ID ${processedAgencyId} does not exist` });
          }
        }
      }
      
      // Prepare update data
      const updateData = {
        ...validatedData
      };
      
      if (processedAgencyId !== undefined) {
        updateData.agencyId = processedAgencyId;
      }
      
      console.log("Updating broker with data:", updateData);
      
      const updatedBroker = await storage.updateBroker(brokerId, updateData);
      
      if (!updatedBroker) {
        return res.status(404).json({ message: "Broker not found" });
      }
      
      return res.json(updatedBroker);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating broker:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete broker
  app.delete(`${apiPrefix}/brokers/:id`, async (req, res) => {
    try {
      const brokerId = parseInt(req.params.id);
      if (isNaN(brokerId)) {
        return res.status(400).json({ message: "Invalid broker ID" });
      }
      
      // Delete broker from database
      const success = await storage.deleteBroker(brokerId);
      
      if (!success) {
        return res.status(404).json({ message: "Broker not found" });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting broker:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create a new broker
  app.post(`${apiPrefix}/brokers`, async (req, res) => {
    try {
      console.log("Received broker creation request:", req.body);
      
      // Define validation schema for new broker
      const schema = z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phoneNumber: z.string(),
        username: z.string().min(1),
        password: z.string().min(1),
        agencyId: z.union([z.number(), z.string(), z.null()]).optional(),
        active: z.boolean().optional()
      });
      
      // Validate request body
      const validatedData = schema.parse(req.body);
      console.log("Validated data:", validatedData);
      
      // Process agencyId - convert string to number or null
      let processedAgencyId = null;
      if (validatedData.agencyId && validatedData.agencyId !== 'null') {
        // Convert string ID to number if needed
        processedAgencyId = typeof validatedData.agencyId === 'string' 
          ? parseInt(validatedData.agencyId) 
          : validatedData.agencyId;
        
        console.log("Processed agency ID:", processedAgencyId);
        
        // Verify that the agency exists
        const agency = await storage.getAgencyById(processedAgencyId);
        if (!agency) {
          return res.status(400).json({ message: `Agency with ID ${processedAgencyId} does not exist` });
        }
      }
      
      // Prepare broker data
      const brokerData = {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phoneNumber: validatedData.phoneNumber,
        username: validatedData.username,
        password: validatedData.password,
        agencyId: processedAgencyId,
        active: validatedData.active ?? true
      };
      
      console.log("Creating broker with data:", brokerData);
      
      // Create broker in database
      const newBroker = await storage.createBroker(brokerData);
      console.log("New broker created:", newBroker);
      
      return res.json(newBroker);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating broker:", error);
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
  
  // Get broker commissions
  app.get(`${apiPrefix}/brokers/:id/commissions`, async (req, res) => {
    try {
      const brokerId = parseInt(req.params.id);
      if (isNaN(brokerId)) {
        return res.status(400).json({ message: "Invalid broker ID" });
      }
      
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string;
      const search = req.query.search as string;
      const date = req.query.date as string;
      
      // Log parameters for debugging
      console.log(`Fetching commissions for broker ID: ${brokerId}, status: ${status || 'all'}, search: ${search || 'none'}, date: ${date || 'none'}`);
      
      const [commissions, total] = await Promise.all([
        storage.getBrokerCommissions(brokerId, { limit, offset, status, search, date }),
        storage.getBrokerCommissionsCount(brokerId, { status, search, date })
      ]);
      
      console.log(`Found ${commissions.length} commissions, total count: ${total}`);
      
      return res.json({
        data: commissions,
        meta: {
          total,
          limit,
          offset
        }
      });
    } catch (error) {
      console.error("Error getting broker commissions:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // --- Agency Routes ---
  
  // Get all agencies
  app.get(`${apiPrefix}/agencies`, async (req, res) => {
    try {
      const agencies = await storage.getAllAgencies();
      return res.json(agencies);
    } catch (error) {
      console.error("Error getting all agencies:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get agency by ID
  app.get(`${apiPrefix}/agencies/:id`, async (req, res) => {
    try {
      const agencyId = parseInt(req.params.id);
      if (isNaN(agencyId)) {
        return res.status(400).json({ message: "Invalid agency ID" });
      }
      
      const agency = await storage.getAgencyById(agencyId);
      
      if (!agency) {
        return res.status(404).json({ message: "Agency not found" });
      }
      
      return res.json(agency);
    } catch (error) {
      console.error("Error getting agency by ID:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create a new agency
  app.post(`${apiPrefix}/agencies`, async (req, res) => {
    try {
      // Validate request body
      const validatedData = organizationInsertSchema.parse(req.body);
      
      // Create agency in database
      const newAgency = await storage.createAgency(validatedData);
      
      return res.status(201).json(newAgency);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating agency:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update agency
  app.patch(`${apiPrefix}/agencies/:id`, async (req, res) => {
    try {
      const agencyId = parseInt(req.params.id);
      if (isNaN(agencyId)) {
        return res.status(400).json({ message: "Invalid agency ID" });
      }
      
      // Define schema for agency update
      const schema = z.object({
        name: z.string().min(1).optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        contactName: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
      });
      
      const validatedData = schema.parse(req.body);
      
      const updatedAgency = await storage.updateAgency(agencyId, validatedData);
      
      if (!updatedAgency) {
        return res.status(404).json({ message: "Agency not found" });
      }
      
      return res.json(updatedAgency);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating agency:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get agency brokers
  app.get(`${apiPrefix}/agencies/:id/brokers`, async (req, res) => {
    try {
      const agencyId = parseInt(req.params.id);
      if (isNaN(agencyId)) {
        return res.status(400).json({ message: "Invalid agency ID" });
      }
      
      const agency = await storage.getAgencyById(agencyId);
      
      if (!agency) {
        return res.status(404).json({ message: "Agency not found" });
      }
      
      const brokers = await storage.getBrokersForAgency(agencyId);
      
      return res.json(brokers);
    } catch (error) {
      console.error("Error getting agency brokers:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get agency dashboard data
  app.get(`${apiPrefix}/agencies/:id/dashboard`, async (req, res) => {
    try {
      const agencyId = parseInt(req.params.id);
      if (isNaN(agencyId)) {
        return res.status(400).json({ message: "Invalid agency ID" });
      }
      
      const agency = await storage.getAgencyById(agencyId);
      
      if (!agency) {
        return res.status(404).json({ message: "Agency not found" });
      }
      
      const dashboardData = await storage.getAgencyDashboardData(agencyId);
      
      return res.json(dashboardData);
    } catch (error) {
      console.error("Error getting agency dashboard data:", error);
      
      // Provide more specific error messages when possible
      if (error instanceof Error) {
        return res.status(500).json({ 
          message: "Error loading agency dashboard data", 
          details: error.message 
        });
      }
      
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // --- Product Management Routes ---
  
  // Get all products
  app.get(`${apiPrefix}/products`, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      return res.json(products);
    } catch (error) {
      console.error("Error getting all products:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get a single product by ID
  app.get(`${apiPrefix}/products/:id`, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const product = await storage.getProductById(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      return res.json(product);
    } catch (error) {
      console.error("Error getting product by ID:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create a new product (Admin only)
  app.post(`${apiPrefix}/products`, authenticate, authorizeAdmin, async (req, res) => {
    try {
      const validatedData = productInsertSchema.parse(req.body);
      
      const newProduct = await storage.createProduct(validatedData);
      return res.status(201).json(newProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating product:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Custom endpoint for product updates
  app.patch(`${apiPrefix}/products/:id`, authenticate, authorizeAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const schema = z.object({
        name: z.string().min(2).optional(),
        description: z.string().optional(),
        commissionStructureId: z.union([z.number(), z.null()]).optional(),
        active: z.boolean().optional()
      });
      
      const validatedData = schema.parse(req.body);
      
      // Update the product in the database
      const updatedProduct = await storage.updateProduct(productId, validatedData);
      
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      return res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating product:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // --- Commission Structure Routes ---
  
  // Get all commission structures
  app.get(`${apiPrefix}/commission-structures`, async (req, res) => {
    try {
      const structures = await storage.getAllCommissionStructures();
      return res.json(structures);
    } catch (error) {
      console.error("Error getting all commission structures:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get a single commission structure by ID
  app.get(`${apiPrefix}/commission-structures/:id`, async (req, res) => {
    try {
      const structureId = parseInt(req.params.id);
      if (isNaN(structureId)) {
        return res.status(400).json({ message: "Invalid structure ID" });
      }
      
      const structure = await storage.getCommissionStructureById(structureId);
      
      if (!structure) {
        return res.status(404).json({ message: "Commission structure not found" });
      }
      
      return res.json(structure);
    } catch (error) {
      console.error("Error getting commission structure by ID:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create a new commission structure (Admin only)
  app.post(`${apiPrefix}/commission-structures`, authenticate, authorizeAdmin, async (req, res) => {
    try {
      const validatedData = commissionStructureInsertSchema.parse(req.body);
      
      const newStructure = await storage.createCommissionStructure(validatedData);
      return res.status(201).json(newStructure);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating commission structure:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update a commission structure (Admin only)
  app.patch(`${apiPrefix}/commission-structures/:id`, authenticate, authorizeAdmin, async (req, res) => {
    try {
      const structureId = parseInt(req.params.id);
      if (isNaN(structureId)) {
        return res.status(400).json({ message: "Invalid structure ID" });
      }
      
      const schema = z.object({
        name: z.string().min(2).optional(),
        structureType: z.enum(['flat_rate', 'per_participant', 'tiered_participant', 'percentage']).optional(),
        configData: z.string().optional(),
        description: z.string().optional().nullable(),
        active: z.boolean().optional()
      });
      
      const validatedData = schema.parse(req.body);
      
      const updatedStructure = await storage.updateCommissionStructure(structureId, validatedData);
      
      if (!updatedStructure) {
        return res.status(404).json({ message: "Commission structure not found" });
      }
      
      return res.json(updatedStructure);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating commission structure:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete a commission structure (Admin only)
  app.delete(`${apiPrefix}/commission-structures/:id`, authenticate, authorizeAdmin, async (req, res) => {
    try {
      const structureId = parseInt(req.params.id);
      if (isNaN(structureId)) {
        return res.status(400).json({ message: "Invalid structure ID" });
      }
      
      // Instead of deleting, we'll just deactivate the structure
      const updatedStructure = await storage.updateCommissionStructure(structureId, { active: false });
      
      if (!updatedStructure) {
        return res.status(404).json({ message: "Commission structure not found" });
      }
      
      return res.json({ message: "Commission structure successfully deactivated" });
    } catch (error) {
      console.error("Error deactivating commission structure:", error);
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
      
      // Get dashboard data from storage
      const dashboardData = await storage.getDashboardData(brokerId);
      
      return res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get commission statistics
  app.get(`${apiPrefix}/commission-statistics`, async (req, res) => {
    try {
      // Extract parameters
      const brokerId = req.query.brokerId ? parseInt(req.query.brokerId as string) : undefined;
      const agencyId = req.query.agencyId ? parseInt(req.query.agencyId as string) : undefined;
      const type = req.query.type as string;
      const timeframe = req.query.timeframe as string || 'year'; // default to 'year'
      
      // Get statistics data
      const statistics = await storage.getCommissionStatistics({
        brokerId,
        agencyId,
        type,
        timeframe,
      });
      
      return res.json(statistics);
    } catch (error) {
      console.error("Error fetching commission statistics:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get all commissions with direct database access
  app.get(`${apiPrefix}/commissions`, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string;
      const search = req.query.search as string;
      const date = req.query.date as string;
      
      console.log(`Fetching all commissions, status: ${status || 'all'}, search: ${search || 'none'}, date: ${date || 'none'}`);
      
      // Use a simpler approach with a direct query
      // Build the query with filters
      let query = `
        SELECT 
          c.id, c.amount, c.status, c.broker_id, c.split_percentage, c.transaction_id, c.notes,
          t.transaction_date, t.transaction_type, t.participant_count, t.commission_rate, t.total_commission,
          bp.program_name, bp.program_type, bp.organization_id,
          o.name as organization_name, o.address, o.city, o.state, o.zip_code
        FROM commissions c
        JOIN transactions t ON c.transaction_id = t.id
        JOIN benefit_programs bp ON t.benefit_program_id = bp.id 
        JOIN organizations o ON bp.organization_id = o.id
        WHERE 1=1
      `;
      
      const queryParams: any[] = [];
      let paramIndex = 1;
      
      // Apply status filter if specified
      if (status && status !== 'all') {
        query += ` AND c.status = $${paramIndex}`;
        queryParams.push(status);
        paramIndex++;
      }
      
      // Apply date filter if specified
      if (date) {
        const dateObj = new Date(date);
        const formattedDate = dateObj.toISOString().split('T')[0];
        query += ` AND DATE(t.transaction_date) = $${paramIndex}`;
        queryParams.push(formattedDate);
        paramIndex++;
      }
      
      // Apply search filter if specified
      if (search) {
        query += ` AND (o.name ILIKE $${paramIndex} OR o.address ILIKE $${paramIndex} OR c.notes ILIKE $${paramIndex})`;
        queryParams.push(`%${search}%`);
        paramIndex++;
      }
      
      // Finalize with sorting and pagination
      query += ` ORDER BY t.transaction_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);
      
      // Count query follows the same filter pattern
      let countQuery = `
        SELECT COUNT(*) 
        FROM commissions c
        JOIN transactions t ON c.transaction_id = t.id
        JOIN benefit_programs bp ON t.benefit_program_id = bp.id 
        JOIN organizations o ON bp.organization_id = o.id
        WHERE 1=1
      `;
      
      // Apply the same filters to the count query
      if (status && status !== 'all') {
        countQuery += ` AND c.status = $1`;
      }
      
      if (date) {
        const dateObj = new Date(date);
        const formattedDate = dateObj.toISOString().split('T')[0];
        countQuery += ` AND DATE(t.transaction_date) = $${status && status !== 'all' ? 2 : 1}`;
      }
      
      if (search) {
        const paramPosition = (status && status !== 'all' ? 1 : 0) + (date ? 1 : 0) + 1;
        countQuery += ` AND (o.name ILIKE $${paramPosition} OR o.address ILIKE $${paramPosition} OR c.notes ILIKE $${paramPosition})`;
      }
      
      // Use the filter parameters for the count query, but without the limit and offset
      const countParams = status && status !== 'all' ? [status] : [];
      if (date) {
        const dateObj = new Date(date);
        const formattedDate = dateObj.toISOString().split('T')[0];
        countParams.push(formattedDate);
      }
      if (search) {
        countParams.push(`%${search}%`);
      }
      
      const [results, countResult] = await Promise.all([
        pool.query(query, queryParams),
        pool.query(countQuery, countParams)
      ]);
      
      // Format the response in the expected structure
      const commissions = results.rows.map(row => ({
        id: row.id,
        amount: row.amount,
        status: row.status,
        brokerId: row.broker_id,
        splitPercentage: row.split_percentage,
        transactionId: row.transaction_id,
        notes: row.notes,
        transaction: {
          id: row.transaction_id,
          transactionDate: row.transaction_date,
          transactionType: row.transaction_type,
          participantCount: row.participant_count,
          commissionRate: row.commission_rate,
          totalCommission: row.total_commission,
          benefitProgram: {
            id: null, // Not needed for display
            programName: row.program_name,
            programType: row.program_type,
            organizationId: row.organization_id,
            organization: {
              id: row.organization_id,
              name: row.organization_name,
              address: row.address,
              city: row.city,
              state: row.state,
              zipCode: row.zip_code
            }
          }
        }
      }));
      
      const total = parseInt(countResult.rows[0].count);
      
      console.log(`Found ${commissions.length} commissions, total count: ${total}`);
      
      return res.json({
        data: commissions,
        meta: {
          total,
          limit,
          offset
        }
      });
    } catch (error) {
      console.error("Error getting commissions:", error);
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
  
  // Delete a commission by ID
  app.delete(`${apiPrefix}/commissions/:id`, async (req, res) => {
    try {
      const commissionId = parseInt(req.params.id);
      if (isNaN(commissionId)) {
        return res.status(400).json({ message: "Invalid commission ID" });
      }
      
      const success = await storage.deleteCommission(commissionId);
      
      if (!success) {
        return res.status(404).json({ message: "Commission not found" });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting commission:", error);
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
        status: z.enum(["pending", "approved"]),
      });
      
      const validatedData = schema.parse(req.body);
      
      const updatedCommission = await storage.updateCommissionStatus(commissionId, validatedData.status);
      
      if (!updatedCommission) {
        return res.status(404).json({ message: "Commission not found" });
      }
      
      return res.json(updatedCommission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating commission status:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create a new commission (including organization, benefit program, and transaction)
  app.post(`${apiPrefix}/commissions`, async (req, res) => {
    try {
      // Log the request for debugging
      console.log("Received commission creation request:", JSON.stringify(req.body));
      
      // Extract required fields from request body
      const { property, transaction, productDetails } = req.body;
      
      // Basic validation for required fields
      if (!property || !property.name || property.name.length < 2) {
        return res.status(400).json({
          errors: [{
            message: "Employer name must be at least 2 characters",
            path: ["property", "name"]
          }]
        });
      }
      
      if (!productDetails || !Array.isArray(productDetails) || productDetails.length === 0) {
        return res.status(400).json({
          errors: [{
            message: "At least one product is required",
            path: ["productDetails"]
          }]
        });
      }
      
      // Create organization data
      const organization = {
        name: property.name || "",
        address: property.address || "",
        city: property.city || "",
        state: property.state || "",
        zipCode: property.zipCode || "",
        contactName: "Contact",
        contactEmail: "contact@example.com",
        contactPhone: ""
      };
      
      // Process each product detail
      const results = [];
      
      for (const product of productDetails) {
        // Skip invalid products
        if (!product || !product.productId) continue;
        
        // Create benefit program data with required fields
        const benefitProgram = {
          programName: property.name || "Default Program",
          programType: product.productId || "cobra",
          programGroup: "health",
          startDate: new Date(),
          endDate: null,
          participantMinimum: 0,
          notes: "",
          organizationId: 0 // Will be set by storage layer
        };
        
        // Process numeric values safely
        const participantCount = parseInt(product.participantCount) || 0;
        const commissionRate = parseFloat(product.commissionRate) || 0;
        
        // Handle fixed amount override
        let transactionAmount;
        if (product.useFixedAmount) {
          transactionAmount = parseFloat(product.transactionAmount) || 0;
        } else {
          transactionAmount = participantCount * commissionRate;
        }
        
        // Create transaction data with required fields
        const transactionData = {
          transactionType: transaction?.transactionType || "enrollment",
          transactionDate: transaction?.transactionDate ? new Date(transaction.transactionDate) : new Date(),
          participantCount: participantCount,
          commissionRate: commissionRate.toString(),
          totalCommission: transactionAmount.toString(),
          notes: transaction?.notes || "",
          benefitProgramId: 0 // Will be set by storage layer
        };
        
        // Process commission splits
        const commissionSplits = [];
        
        if (product.commissions && Array.isArray(product.commissions)) {
          for (const split of product.commissions) {
            if (!split) continue;
            
            // Skip invalid splits (unless it's the only one)
            const splitPercentage = parseFloat(split.splitPercentage) || 0;
            if (splitPercentage <= 0 && product.commissions.length > 1) continue;
            
            // Use the broker ID from the form - should be a valid broker ID
            const brokerId = typeof split.brokerId === 'number' ? split.brokerId : 
                           (split.brokerId ? parseInt(split.brokerId.toString()) : null);
            
            // Skip splits with no broker assigned if there are other valid splits
            if (brokerId === 0 && product.commissions.filter(c => parseFloat(c.splitPercentage || "0") > 0).length > 1) {
              continue;
            }
            
            // Calculate split amount based on percentage
            const amount = (transactionAmount * (splitPercentage / 100)).toFixed(2);
            
            commissionSplits.push({
              brokerId: brokerId,
              splitPercentage: split.splitPercentage.toString(),
              amount: amount,
              status: "pending",
              notes: split.notes || ""
            });
          }
        }
        
        // Ensure at least one commission exists
        if (commissionSplits.length === 0) {
          commissionSplits.push({
            brokerId: null, // No broker / unassigned
            splitPercentage: "100",
            amount: transactionAmount.toFixed(2),
            status: "pending",
            notes: ""
          });
        }
        
        try {
          // Create the commission in the database
          const result = await storage.createCommission({
            organization,
            benefitProgram,
            transaction: transactionData,
            commissions: commissionSplits
          });
          
          results.push(result);
        } catch (err) {
          console.error("Error creating commission for product:", product.productId, err);
          // Continue with other products if one fails
        }
      }
      
      // Check if any commissions were created
      if (results.length === 0) {
        return res.status(500).json({ message: "Failed to create any commissions" });
      }
      
      // Return the created commission
      return res.status(201).json(results[0]);
    } catch (error) {
      console.error("Error creating commission:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create the HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}
