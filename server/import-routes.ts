import { Router, Request, Response } from "express";
import { storage } from "./storage";
import multer from "multer";
import { parse } from "csv-parse";
import fs from "fs";
import path from "path";
import {
  agencyInsertSchema,
  brokerInsertSchema,
  AgencyInsert,
  BrokerInsert,
  Organization,
  BenefitProgram,
  Transaction,
  Commission
} from "@shared/schema";
import { authenticate, authorizeAdmin } from "./middleware/auth";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: "temp/uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept CSV files
    if (file.mimetype !== "text/csv" && file.originalname.split(".").pop() !== "csv") {
      return cb(new Error("Only CSV files are allowed"));
    }
    cb(null, true);
  },
});

// Import agencies endpoint
router.post("/agencies", authenticate, authorizeAdmin, upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const results: any[] = [];
    const parser = fs
      .createReadStream(req.file.path)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }));

    for await (const record of parser) {
      results.push(record);
    }

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    if (results.length === 0) {
      return res.status(400).json({ message: "No data found in the CSV file" });
    }

    // Validate and import agencies
    const importedCount = await importAgencies(results);

    return res.json({
      message: `Successfully imported ${importedCount} agencies`,
      count: importedCount,
    });
  } catch (error) {
    console.error("Error importing agencies:", error);
    
    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({ message: "Error importing agencies" });
  }
});

// Import brokers endpoint
router.post("/brokers", authenticate, authorizeAdmin, upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const results: any[] = [];
    const parser = fs
      .createReadStream(req.file.path)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }));

    for await (const record of parser) {
      results.push(record);
    }

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    if (results.length === 0) {
      return res.status(400).json({ message: "No data found in the CSV file" });
    }

    // Validate and import brokers
    const importedCount = await importBrokers(results);

    return res.json({
      message: `Successfully imported ${importedCount} brokers`,
      count: importedCount,
    });
  } catch (error) {
    console.error("Error importing brokers:", error);
    
    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({ message: "Error importing brokers" });
  }
});

// Import commissions endpoint
router.post("/commissions", authenticate, authorizeAdmin, upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const results: any[] = [];
    const parser = fs
      .createReadStream(req.file.path)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }));

    for await (const record of parser) {
      results.push(record);
    }

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    if (results.length === 0) {
      return res.status(400).json({ message: "No data found in the CSV file" });
    }

    // Validate and import commissions
    const importedCount = await importCommissions(results);

    return res.json({
      message: `Successfully imported ${importedCount} commissions`,
      count: importedCount,
    });
  } catch (error) {
    console.error("Error importing commissions:", error);
    
    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({ message: "Error importing commissions" });
  }
});

// Helper function to import agencies
async function importAgencies(agencies: any[]): Promise<number> {
  let importedCount = 0;

  for (const agencyData of agencies) {
    try {
      // Map CSV columns to agency schema
      const mappedData = {
        name: agencyData.name,
        address: agencyData.address,
        city: agencyData.city,
        state: agencyData.state,
        zipCode: agencyData.zipCode,
        phone: agencyData.phone || null,
        email: agencyData.email || null,
        website: agencyData.website || null,
        active: agencyData.active === "true" || agencyData.active === "1" || true,
      };

      // Validate data
      const validatedData = agencyInsertSchema.parse(mappedData);
      
      // Create agency
      await storage.createAgency(validatedData);
      importedCount++;
    } catch (error) {
      console.error(`Error importing agency ${agencyData.name}:`, error);
      // Continue with the next agency
    }
  }

  return importedCount;
}

// Helper function to import brokers
async function importBrokers(brokers: any[]): Promise<number> {
  let importedCount = 0;

  for (const brokerData of brokers) {
    try {
      // Map CSV columns to broker schema
      const mappedData = {
        firstName: brokerData.firstName,
        lastName: brokerData.lastName,
        email: brokerData.email || `${brokerData.firstName.toLowerCase()}.${brokerData.lastName.toLowerCase()}@example.com`,
        phoneNumber: brokerData.phone || brokerData.phoneNumber || "",
        agencyId: parseInt(brokerData.agencyId) || null,
        active: brokerData.active === "true" || brokerData.active === "1" || true,
        username: brokerData.username || `${brokerData.firstName.toLowerCase()}${brokerData.lastName.toLowerCase()}`,
        password: brokerData.password || "broker123", // Default password
      };

      // Validate data
      const validatedData = brokerInsertSchema.parse(mappedData);
      
      // Create broker
      await storage.createBroker(validatedData);
      importedCount++;
    } catch (error) {
      console.error(`Error importing broker ${brokerData.firstName} ${brokerData.lastName}:`, error);
      // Continue with the next broker
    }
  }

  return importedCount;
}

// Helper function to import commissions
async function importCommissions(commissions: any[]): Promise<number> {
  let importedCount = 0;

  for (const commissionData of commissions) {
    try {
      // Create organization, benefit program, transaction and commission
      const importData = {
        organization: {
          name: commissionData.employerName,
          address: commissionData.employerAddress || "123 Main St",
          city: commissionData.employerCity || "Anytown",
          state: commissionData.employerState || "CA",
          zipCode: commissionData.employerZipCode || "12345",
          contactName: commissionData.contactName || "Contact Person",
          contactEmail: commissionData.contactEmail || "contact@example.com",
          contactPhone: commissionData.contactPhone || null
        },
        benefitProgram: {
          programName: commissionData.programName,
          programType: commissionData.programType,
          programGroup: commissionData.programGroup || commissionData.programType, // Default to programType if not provided
          participantCount: parseInt(commissionData.participantCount) || 100,
          participantMinimum: parseInt(commissionData.participantMinimum) || 0,
          startDate: commissionData.startDate ? new Date(commissionData.startDate) : new Date(),
          endDate: commissionData.endDate ? new Date(commissionData.endDate) : undefined,
          notes: commissionData.notes || null
        },
        transaction: {
          transactionDate: commissionData.transactionDate,
          transactionType: commissionData.transactionType,
          commissionRate: commissionData.commissionRate || "2.00", // Default rate per participant
          totalCommission: commissionData.totalCommission || commissionData.amount // Use the amount field if totalCommission is not provided
        },
        commissions: [
          {
            brokerId: parseInt(commissionData.brokerId),
            splitPercentage: commissionData.splitPercentage || "100.00", // Default to 100% if not provided
            status: commissionData.status || "pending" // Default to pending if not provided
          }
        ]
      };
      
      // Create commission
      await storage.createCommission(importData);
      importedCount++;
    } catch (error) {
      console.error(`Error importing commission:`, error);
      // Continue with the next commission
    }
  }

  return importedCount;
}

// Endpoint to download templates
router.get("/templates/:type", (req: Request, res: Response) => {
  const templateType = req.params.type;
  
  let headers = "";
  
  switch (templateType) {
    case "agencies":
      headers = "name,address,city,state,zipCode,phone,email,website,active";
      break;
    case "brokers":
      headers = "firstName,lastName,email,phone,agencyId,active,username,password";
      break;
    case "commissions":
      headers = "brokerId,amount,status,transactionDate,transactionType,programName,programType,programGroup,employerName,employerAddress,employerCity,employerState,employerZipCode,participantCount,commissionRate,splitPercentage";
      break;
    default:
      return res.status(400).json({ message: "Invalid template type" });
  }
  
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=${templateType}-template.csv`);
  
  return res.send(headers);
});

export default router;