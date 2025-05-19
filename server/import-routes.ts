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
    const importResult = await importAgencies(results);

    return res.json({
      message: `Successfully imported ${importResult.importedCount} agencies`,
      count: importResult.importedCount,
      errorCount: importResult.errorCount,
      validRecords: results.length - importResult.errorCount,
      totalRecords: results.length,
      errorDetails: importResult.errorDetails
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
    const importResult = await importBrokers(results);

    return res.json({
      message: `Successfully imported ${importResult.importedCount} brokers`,
      count: importResult.importedCount,
      errorCount: importResult.errorCount,
      validRecords: results.length - importResult.errorCount,
      totalRecords: results.length,
      errorDetails: importResult.errorDetails
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
    const importResult = await importCommissions(results);

    return res.json({
      message: `Successfully imported ${importResult.importedCount} commissions`,
      count: importResult.importedCount,
      errorCount: importResult.errorCount,
      validRecords: results.length - importResult.errorCount,
      totalRecords: results.length,
      errorDetails: importResult.errorDetails
    });
  } catch (error) {
    console.error("Error importing commissions:", error);
    
    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    // Provide more specific error message if possible
    const errorMessage = error instanceof Error 
      ? `Error importing commissions: ${error.message}`
      : "Error importing commissions";
    
    return res.status(500).json({ 
      message: errorMessage,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Helper function to import agencies
async function importAgencies(agencies: any[]): Promise<{importedCount: number, errorCount: number, errorDetails: Array<{index: number, row: any, errors: string[]}>}> {
  let importedCount = 0;
  let errorCount = 0;
  let errorDetails: Array<{index: number, row: any, errors: string[]}> = [];
  let validAgencies: any[] = [];

  // Validate all agencies first and collect validation results
  agencies.forEach((agencyData, index) => {
    const rowErrors: string[] = [];
    
    // Validate required fields first
    const requiredFields = ['name', 'address', 'city', 'state', 'zipCode'];
    const missingFields = requiredFields.filter(field => 
      !agencyData[field] || String(agencyData[field]).trim() === ''
    );
    
    if (missingFields.length > 0) {
      rowErrors.push(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Additional field validations
    if (agencyData.zipCode && !/^\d{5}(-\d{4})?$/.test(String(agencyData.zipCode))) {
      rowErrors.push(`Invalid zip code format: ${agencyData.zipCode}`);
    }
    
    if (agencyData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(agencyData.email))) {
      rowErrors.push(`Invalid email format: ${agencyData.email}`);
    }
    
    // If there are errors, add to error details
    if (rowErrors.length > 0) {
      errorDetails.push({
        index,
        row: agencyData,
        errors: rowErrors
      });
      errorCount++;
    } else {
      // If no errors, add to valid agencies for import
      validAgencies.push(agencyData);
    }
  });

  // Now import only the valid agencies
  for (const agencyData of validAgencies) {
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

      // Validate data against schema
      const validatedData = agencyInsertSchema.parse(mappedData);
      
      // Create agency
      await storage.createAgency(validatedData);
      importedCount++;
    } catch (error) {
      console.error(`Error importing agency ${agencyData.name}:`, error);
      
      // Add unexpected errors to error details
      errorDetails.push({
        index: agencies.findIndex(a => a.name === agencyData.name),
        row: agencyData,
        errors: [error instanceof Error ? error.message : String(error)]
      });
      
      errorCount++;
    }
  }

  console.log(`Import validation: ${validAgencies.length} valid agencies, ${errorCount} invalid`);
  console.log(`Import completed: ${importedCount} agencies imported, ${errorCount} failed`);
  
  return {
    importedCount,
    errorCount,
    errorDetails
  };
}

// Helper function to import brokers
async function importBrokers(brokers: any[]): Promise<{importedCount: number, errorCount: number, errorDetails: Array<{index: number, row: any, errors: string[]}>}> {
  let importedCount = 0;
  let errorCount = 0;
  let errorDetails: Array<{index: number, row: any, errors: string[]}> = [];
  let validBrokers: any[] = [];

  // First, validate all brokers and collect validation errors
  for (let index = 0; index < brokers.length; index++) {
    const brokerData = brokers[index];
    const rowErrors: string[] = [];
    
    // Validate required fields first
    const requiredFields = ['firstName', 'lastName', 'email', 'agencyId'];
    const missingFields = requiredFields.filter(field => 
      !brokerData[field] || String(brokerData[field]).trim() === ''
    );
    
    if (missingFields.length > 0) {
      rowErrors.push(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Additional field validations
    if (brokerData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(brokerData.email))) {
      rowErrors.push(`Invalid email format: ${brokerData.email}`);
    }
    
    if (brokerData.agencyId && isNaN(Number(brokerData.agencyId))) {
      rowErrors.push(`Agency ID must be a number: ${brokerData.agencyId}`);
    }

    // Check if agency exists (we'll do this in the import phase to avoid too many DB queries)
    
    // If there are errors, add to error details
    if (rowErrors.length > 0) {
      errorDetails.push({
        index,
        row: brokerData,
        errors: rowErrors
      });
      errorCount++;
    } else {
      // If no errors, add to valid brokers for import
      validBrokers.push(brokerData);
    }
  }

  // Now process the valid brokers
  for (const brokerData of validBrokers) {
    try {
      // Check if agency exists (now we do the DB check)
      if (brokerData.agencyId) {
        const agencyId = parseInt(brokerData.agencyId);
        const agency = await storage.getAgencyById(agencyId);
        if (!agency) {
          const brokerIndex = brokers.findIndex(b => 
            b.firstName === brokerData.firstName && 
            b.lastName === brokerData.lastName
          );
          
          errorDetails.push({
            index: brokerIndex,
            row: brokerData,
            errors: [`Agency with ID ${agencyId} not found`]
          });
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
        username: brokerData.username || `${brokerData.firstName.toLowerCase()}${brokerData.lastName.toLowerCase()}_${Date.now().toString().slice(-5)}`,
        password: brokerData.password || "broker123", // Default password
      };

      // Validate data against schema
      const validatedData = brokerInsertSchema.parse(mappedData);
      
      // Create broker
      await storage.createBroker(validatedData);
      importedCount++;
    } catch (error) {
      console.error(`Error importing broker ${brokerData.firstName} ${brokerData.lastName}:`, error);
      
      // Add to error details
      const brokerIndex = brokers.findIndex(b => 
        b.firstName === brokerData.firstName && 
        b.lastName === brokerData.lastName
      );
      
      errorDetails.push({
        index: brokerIndex,
        row: brokerData,
        errors: [error instanceof Error ? error.message : String(error)]
      });
      
      errorCount++;
    }
  }

  console.log(`Import validation: ${validBrokers.length} valid brokers, ${errorCount} invalid`);
  console.log(`Import completed: ${importedCount} brokers imported, ${errorCount} failed`);
  
  return {
    importedCount,
    errorCount,
    errorDetails
  };
}

// Helper function to import commissions
async function importCommissions(commissions: any[]): Promise<{importedCount: number, errorCount: number, errorDetails: Array<{index: number, row: any, errors: string[]}>}> {
  let importedCount = 0;
  let errorCount = 0;
  let errorDetails: Array<{index: number, row: any, errors: string[]}> = [];
  let validCommissions: any[] = [];

  // First, validate all commissions and collect validation errors
  for (let index = 0; index < commissions.length; index++) {
    const commissionData = commissions[index];
    const rowErrors: string[] = [];
    
    // Validate required fields first
    const requiredFields = ['amount', 'transactionDate', 'transactionType', 'programName', 'programType', 'employerName'];
    const missingFields = requiredFields.filter(field => 
      !commissionData[field] || String(commissionData[field]).trim() === ''
    );
    
    if (missingFields.length > 0) {
      rowErrors.push(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Additional field validations
    if (commissionData.amount && isNaN(Number(commissionData.amount))) {
      rowErrors.push(`Amount must be a number: ${commissionData.amount}`);
    }
    
    if (commissionData.transactionDate && !/^\d{4}-\d{2}-\d{2}$/.test(String(commissionData.transactionDate))) {
      rowErrors.push(`Transaction date must be in YYYY-MM-DD format: ${commissionData.transactionDate}`);
    }
    
    // Validate split percentages sum (for multiple broker assignment)
    let totalSplitPercentage = 0;
    if (commissionData.brokerId1 && commissionData.splitPercentage1) {
      totalSplitPercentage += parseFloat(commissionData.splitPercentage1) || 0;
    }
    if (commissionData.brokerId2 && commissionData.splitPercentage2) {
      totalSplitPercentage += parseFloat(commissionData.splitPercentage2) || 0;
    }
    if (commissionData.brokerId3 && commissionData.splitPercentage3) {
      totalSplitPercentage += parseFloat(commissionData.splitPercentage3) || 0;
    }
    if (commissionData.brokerId4 && commissionData.splitPercentage4) {
      totalSplitPercentage += parseFloat(commissionData.splitPercentage4) || 0;
    }
    
    // If there are broker splits, make sure they total 100%
    if (totalSplitPercentage > 0 && Math.abs(totalSplitPercentage - 100) > 0.01) {
      rowErrors.push(`Split percentages must total 100%, currently ${totalSplitPercentage.toFixed(2)}%`);
    }
    
    // If there are errors, add to error details
    if (rowErrors.length > 0) {
      errorDetails.push({
        index,
        row: commissionData,
        errors: rowErrors
      });
      errorCount++;
    } else {
      // If no errors, add to valid commissions for import
      validCommissions.push(commissionData);
    }
  }

  // Now process the valid commissions
  for (const commissionData of validCommissions) {
    try {
      // Do broker lookups for validation
      // Check legacy format broker
      if (commissionData.brokerId && !commissionData.brokerId1) {
        const brokerId = parseInt(commissionData.brokerId);
        if (!isNaN(brokerId) && brokerId > 0) {
          const broker = await storage.getBrokerById(brokerId);
          if (!broker) {
            const index = commissions.findIndex(c => 
              c.amount === commissionData.amount && 
              c.transactionDate === commissionData.transactionDate &&
              c.employerName === commissionData.employerName
            );
            
            errorDetails.push({
              index: index !== -1 ? index : 0,
              row: commissionData,
              errors: [`Broker with ID ${brokerId} not found`]
            });
            errorCount++;
            continue;
          }
        }
      }
      
      // Check multiple broker format
      const brokerCheckPromises = [];
      for (let i = 1; i <= 4; i++) {
        const brokerId = commissionData[`brokerId${i}`];
        if (brokerId && parseInt(brokerId) > 0) {
          brokerCheckPromises.push(
            storage.getBrokerById(parseInt(brokerId))
              .then(broker => ({ brokerId, broker, index: i }))
          );
        }
      }
      
      const brokerCheckResults = await Promise.all(brokerCheckPromises);
      const missingBrokers = brokerCheckResults
        .filter(result => !result.broker)
        .map(result => result.brokerId);
      
      if (missingBrokers.length > 0) {
        const index = commissions.findIndex(c => 
          c.amount === commissionData.amount && 
          c.transactionDate === commissionData.transactionDate &&
          c.employerName === commissionData.employerName
        );
        
        errorDetails.push({
          index: index !== -1 ? index : 0,
          row: commissionData,
          errors: [`Broker(s) with ID(s) ${missingBrokers.join(', ')} not found`]
        });
        errorCount++;
        continue;
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
        commissions: []
      };
      
      // Process multiple broker assignments
      // Function to add a broker commission if data is present
      const addBrokerCommission = (idx: number) => {
        const brokerId = commissionData[`brokerId${idx}`];
        const splitPercentage = commissionData[`splitPercentage${idx}`];
        
        if (brokerId || (idx === 1 && !brokerId)) { // Always process first broker even if null (unassigned)
          const commission = {
            brokerId: brokerId ? parseInt(brokerId) : null,
            splitPercentage: splitPercentage || (idx === 1 ? "100.00" : "0.00"),
            status: commissionData.status || "pending",
            notes: commissionData.notes || null,
            amount: calculateAmount(splitPercentage, commissionData.amount)
          };
          importData.commissions.push(commission);
          return true;
        }
        return false;
      };
      
      // Helper to calculate amount based on percentage
      const calculateAmount = (percentage: string, totalAmount: string): string => {
        if (!percentage || !totalAmount) return "0.00";
        const percent = parseFloat(percentage) / 100;
        const total = parseFloat(totalAmount);
        return (total * percent).toFixed(2);
      };
      
      // Check for legacy format (single broker)
      if (commissionData.brokerId && !commissionData.brokerId1) {
        importData.commissions.push({
          brokerId: parseInt(commissionData.brokerId),
          splitPercentage: commissionData.splitPercentage || "100.00",
          status: commissionData.status || "pending",
          notes: commissionData.notes || null,
          amount: commissionData.amount || commissionData.totalCommission || "0.00"
        });
      } else {
        // Add up to 4 brokers
        for (let i = 1; i <= 4; i++) {
          addBrokerCommission(i);
        }
        
        // If no commissions were added, add an unassigned commission
        if (importData.commissions.length === 0) {
          importData.commissions.push({
            brokerId: null,
            splitPercentage: "100.00",
            status: commissionData.status || "pending",
            notes: commissionData.notes || null,
            amount: commissionData.amount || commissionData.totalCommission || "0.00"
          });
        }
      }
      
      // Create commission
      await storage.createCommission(importData);
      importedCount++;
    } catch (error) {
      console.error(`Error importing commission:`, error);
      
      // Add unexpected errors to error details
      const index = commissions.findIndex(c => 
        c.amount === commissionData.amount && 
        c.transactionDate === commissionData.transactionDate &&
        c.employerName === commissionData.employerName
      );
      
      errorDetails.push({
        index: index !== -1 ? index : 0,
        row: commissionData,
        errors: [error instanceof Error ? error.message : String(error)]
      });
      
      errorCount++;
    }
  }

  console.log(`Import validation: ${validCommissions.length} valid commissions, ${errorCount} invalid`);
  console.log(`Import completed: ${importedCount} commissions imported, ${errorCount} failed`);
  
  return {
    importedCount,
    errorCount,
    errorDetails
  };
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
      headers = "amount,status,transactionDate,transactionType,programName,programType,employerName,brokerId1,splitPercentage1,brokerId2,splitPercentage2,brokerId3,splitPercentage3,brokerId4,splitPercentage4,participantCount,commissionRate";
      sampleRows = [
        "1000.00,pending,2023-01-15,enrollment,Employee HSA Plan,hsa,ACME Corp,1,100.00,,,,,,50,2.00",
        "750.00,pending,2023-01-20,renewal,COBRA Administration,cobra,Global Industries,1,60.00,2,40.00,,,,35,2.50",
        "500.00,pending,2023-01-25,adjustment,FSA Benefits,fsa,Sunshine LLC,1,50.00,2,25.00,3,25.00,,25,2.00",
        "1200.00,pending,2023-01-30,enrollment,HRA Plan,hra,Metro Corp,1,25.00,2,25.00,3,25.00,4,25.00,60,2.00"
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