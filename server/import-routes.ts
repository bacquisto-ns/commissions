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
    
    // Provide more specific error message if possible
    const errorMessage = error instanceof Error 
      ? `Error importing agencies: ${error.message}`
      : "Error importing agencies";
    
    return res.status(500).json({ 
      message: errorMessage,
      error: error instanceof Error ? error.message : String(error)
    });
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
    
    // Provide more specific error message if possible
    const errorMessage = error instanceof Error 
      ? `Error importing brokers: ${error.message}`
      : "Error importing brokers";
    
    return res.status(500).json({ 
      message: errorMessage,
      error: error instanceof Error ? error.message : String(error)
    });
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
  let errorCount = 0;

  for (const agencyData of agencies) {
    try {
      // Validate required fields first
      const requiredFields = ['name', 'address', 'city', 'state', 'zipCode'];
      const missingFields = requiredFields.filter(field => 
        !agencyData[field] || String(agencyData[field]).trim() === ''
      );
      
      if (missingFields.length > 0) {
        console.error(`Error importing agency: Missing required fields: ${missingFields.join(', ')}`);
        errorCount++;
        continue;
      }
      
      // Additional field validations
      if (agencyData.zipCode && !/^\d{5}(-\d{4})?$/.test(String(agencyData.zipCode))) {
        console.error(`Error importing agency ${agencyData.name}: Invalid zip code format`);
        errorCount++;
        continue;
      }
      
      if (agencyData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(agencyData.email))) {
        console.error(`Error importing agency ${agencyData.name}: Invalid email format`);
        errorCount++;
        continue;
      }
      
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

      // Validate data against schema
      const validatedData = agencyInsertSchema.parse(mappedData);
      
      // Create agency
      await storage.createAgency(validatedData);
      importedCount++;
    } catch (error) {
      console.error(`Error importing agency ${agencyData.name}:`, error);
      errorCount++;
      // Continue with the next agency
    }
  }

  console.log(`Import completed: ${importedCount} agencies imported, ${errorCount} failed`);
  return importedCount;
}

// Helper function to import brokers
async function importBrokers(brokers: any[]): Promise<number> {
  let importedCount = 0;
  let errorCount = 0;

  for (const brokerData of brokers) {
    try {
      // Validate required fields first
      const requiredFields = ['firstName', 'lastName', 'email', 'agencyId'];
      const missingFields = requiredFields.filter(field => 
        !brokerData[field] || String(brokerData[field]).trim() === ''
      );
      
      if (missingFields.length > 0) {
        console.error(`Error importing broker: Missing required fields: ${missingFields.join(', ')}`);
        errorCount++;
        continue;
      }
      
      // Additional field validations
      if (brokerData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(brokerData.email))) {
        console.error(`Error importing broker ${brokerData.firstName} ${brokerData.lastName}: Invalid email format`);
        errorCount++;
        continue;
      }
      
      if (brokerData.agencyId && isNaN(Number(brokerData.agencyId))) {
        console.error(`Error importing broker ${brokerData.firstName} ${brokerData.lastName}: Agency ID must be a number`);
        errorCount++;
        continue;
      }

      // Check if agency exists
      if (brokerData.agencyId) {
        const agencyId = parseInt(brokerData.agencyId);
        const agency = await storage.getAgencyById(agencyId);
        if (!agency) {
          console.error(`Error importing broker ${brokerData.firstName} ${brokerData.lastName}: Agency with ID ${agencyId} not found`);
          errorCount++;
          continue;
        }
      }
      
      // Map CSV columns to broker schema
      const mappedData = {
        firstName: brokerData.firstName,
        lastName: brokerData.lastName,
        email: brokerData.email,
        phoneNumber: brokerData.phone || brokerData.phoneNumber || "",
        agencyId: parseInt(brokerData.agencyId) || null,
        active: brokerData.active === "true" || brokerData.active === "1" || true,
        username: brokerData.username || `${brokerData.firstName.toLowerCase()}${brokerData.lastName.toLowerCase()}`,
        password: brokerData.password || "broker123", // Default password
      };

      // Validate data against schema
      const validatedData = brokerInsertSchema.parse(mappedData);
      
      // Create broker
      await storage.createBroker(validatedData);
      importedCount++;
    } catch (error) {
      console.error(`Error importing broker ${brokerData.firstName} ${brokerData.lastName}:`, error);
      errorCount++;
      // Continue with the next broker
    }
  }

  console.log(`Import completed: ${importedCount} brokers imported, ${errorCount} failed`);
  return importedCount;
}

// Helper function to import commissions
async function importCommissions(commissions: any[]): Promise<number> {
  let importedCount = 0;
  let errorCount = 0;

  for (const commissionData of commissions) {
    try {
      // Validate required fields first
      const requiredFields = ['amount', 'transactionDate', 'transactionType', 'programName', 'programType', 'employerName'];
      const missingFields = requiredFields.filter(field => 
        !commissionData[field] || String(commissionData[field]).trim() === ''
      );
      
      if (missingFields.length > 0) {
        console.error(`Error importing commission: Missing required fields: ${missingFields.join(', ')}`);
        errorCount++;
        continue;
      }
      
      // Additional field validations
      if (commissionData.amount && isNaN(Number(commissionData.amount))) {
        console.error(`Error importing commission: Amount must be a number`);
        errorCount++;
        continue;
      }
      
      if (commissionData.transactionDate && !/^\d{4}-\d{2}-\d{2}$/.test(String(commissionData.transactionDate))) {
        console.error(`Error importing commission: Transaction date must be in YYYY-MM-DD format`);
        errorCount++;
        continue;
      }
      
      // Check if broker exists (if a broker is specified)
      if (commissionData.brokerId) {
        const brokerId = parseInt(commissionData.brokerId);
        if (!isNaN(brokerId)) {
          const broker = await storage.getBrokerById(brokerId);
          if (!broker && brokerId > 0) {
            console.error(`Error importing commission: Broker with ID ${brokerId} not found`);
            errorCount++;
            continue;
          }
        }
      }
      
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
          endDate: commissionData.endDate ? new Date(commissionData.endDate) : null,
          notes: commissionData.notes || null
        },
        transaction: {
          transactionDate: commissionData.transactionDate ? new Date(commissionData.transactionDate) : new Date(),
          transactionType: commissionData.transactionType,
          commissionRate: commissionData.commissionRate || "2.00", // Default rate per participant
          totalCommission: commissionData.totalCommission || commissionData.amount, // Use the amount field if totalCommission is not provided
          participantCount: parseInt(commissionData.participantCount) || 100,
          notes: commissionData.notes || null
        },
        commissions: [
          {
            brokerId: commissionData.brokerId ? parseInt(commissionData.brokerId) : null, // Allow null for unassigned
            splitPercentage: commissionData.splitPercentage || "100.00", // Default to 100% if not provided
            status: commissionData.status || "pending", // Default to pending if not provided
            notes: commissionData.notes || null,
            amount: commissionData.amount || commissionData.totalCommission || "0.00"
          }
        ]
      };
      
      // Create commission
      await storage.createCommission(importData);
      importedCount++;
    } catch (error) {
      console.error(`Error importing commission:`, error);
      errorCount++;
      // Continue with the next commission
    }
  }

  console.log(`Import completed: ${importedCount} commissions imported, ${errorCount} failed`);
  return importedCount;
}

// Endpoint to download templates
router.get("/templates/:type", (req: Request, res: Response) => {
  const templateType = req.params.type;
  
  let headers = "";
  let sampleRows = [];
  let filename = `${templateType}-template.csv`;
  
  switch (templateType) {
    case "agencies":
      headers = "name,address,city,state,zipCode,phone,email,website,active";
      sampleRows = [
        "ABC Insurance Agency,123 Main St,New York,NY,10001,555-123-4567,info@abcinsurance.com,www.abcinsurance.com,true",
        "XYZ Benefits Group,456 Park Ave,Boston,MA,02108,555-987-6543,contact@xyzbenefits.com,www.xyzbenefits.com,true"
      ];
      break;
    case "brokers":
      headers = "firstName,lastName,email,phone,agencyId,active,username,password";
      sampleRows = [
        "John,Smith,john.smith@example.com,555-123-4567,1,true,johnsmith,password123",
        "Jane,Doe,jane.doe@example.com,555-987-6543,1,true,janedoe,password123",
        "Michael,Johnson,michael.johnson@example.com,555-456-7890,2,true,michaelj,password123"
      ];
      break;
    case "commissions":
      headers = "amount,status,transactionDate,transactionType,programName,programType,employerName,brokerId,participantCount,commissionRate,splitPercentage";
      sampleRows = [
        "1000.00,pending,2023-01-15,enrollment,Employee HSA Plan,hsa,ACME Corp,1,50,2.00,100.00",
        "750.00,pending,2023-01-20,renewal,COBRA Administration,cobra,Global Industries,2,35,2.50,100.00",
        "500.00,pending,2023-01-25,adjustment,FSA Benefits,fsa,Sunshine LLC,,25,2.00,100.00"
      ];
      break;
    default:
      return res.status(400).json({ message: "Invalid template type" });
  }
  
  // Create the CSV content with header and multiple sample rows
  let csvContent = headers + "\n" + sampleRows.join("\n");
  
  // Add a comment line at the top explaining required fields
  let requiredFields = "";
  if (templateType === "agencies") {
    requiredFields = "# Required fields: name, address, city, state, zipCode";
  } else if (templateType === "brokers") {
    requiredFields = "# Required fields: firstName, lastName, email, agencyId";
  } else if (templateType === "commissions") {
    requiredFields = "# Required fields: amount, transactionDate, transactionType, programName, programType, employerName";
  }
  
  csvContent = requiredFields + "\n" + csvContent;
  
  // Send as an actual file using Express's download method
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  // Send the CSV content
  return res.send(csvContent);
});

export default router;