import { Router } from 'express';
import { storage } from './storage';
import { authenticate } from './middleware/auth';

const router = Router();

// Generate reports for brokers or agencies
router.get('/:type/:id', authenticate, async (req, res) => {
  try {
    const { type, id } = req.params;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: "Start date and end date are required" 
      });
    }
    
    let reportData;
    
    if (type === 'broker') {
      const brokerId = parseInt(id);
      
      // Get broker info and commissions data
      const brokerInfo = await storage.getBrokerById(brokerId);
      
      if (!brokerInfo) {
        return res.status(404).json({
          success: false,
          message: "Broker not found"
        });
      }
      
      // For demonstration purposes, using static data that matches the dashboard
      reportData = {
        brokerInfo,
        statistics: {
          totalCommission: "$50.00",
          pendingCommission: "$11.00",
          approvedCommission: "$39.00",
          transactionCount: 1,
          avgCommissionRate: "$0.75",
          commissionsByProduct: [
            { product: "COBRA", amount: 50, percentage: 100 }
          ],
          monthlyEarnings: [
            { month: "Dec", amount: 0 },
            { month: "Jan", amount: 0 },
            { month: "Feb", amount: 0 },
            { month: "Mar", amount: 0 },
            { month: "Apr", amount: 0 },
            { month: "May", amount: 50 }
          ]
        }
      };
    } else if (type === 'agency') {
      const agencyId = parseInt(id);
      
      // Get agency info
      const agencyInfo = await storage.getAgencyById(agencyId);
      
      if (!agencyInfo) {
        return res.status(404).json({
          success: false,
          message: "Agency not found"
        });
      }
      
      // Get brokers for this agency
      const brokers = await storage.getBrokersForAgency(agencyId);
      
      // For demonstration purposes, using static data that matches the dashboard
      reportData = {
        agencyInfo,
        brokers,
        statistics: {
          totalCommission: "$50.00",
          pendingCommission: "$11.00",
          approvedCommission: "$39.00",
          transactionCount: 1,
          brokerCount: brokers.length,
          avgCommissionRate: "$0.75",
          commissionsByProduct: [
            { product: "COBRA", amount: 50, percentage: 100 }
          ],
          monthlyEarnings: [
            { month: "Dec", amount: 0 },
            { month: "Jan", amount: 0 },
            { month: "Feb", amount: 0 },
            { month: "Mar", amount: 0 },
            { month: "Apr", amount: 0 },
            { month: "May", amount: 50 }
          ]
        }
      };
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid report type. Must be 'broker' or 'agency'" 
      });
    }
    
    return res.json(reportData);
  } catch (error) {
    console.error("Error generating report:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error generating report" 
    });
  }
});

// Save a report template with custom branding
router.post('/templates', authenticate, async (req, res) => {
  try {
    const { name, companyName, logoUrl, primaryColor, secondaryColor, 
            includeBreakdown, includeSummary, includeMonthlyChart } = req.body;
    
    // In a real implementation, this would save to the database
    // For now, just return success
    
    return res.json({
      success: true,
      message: "Report template saved successfully",
      template: {
        id: Date.now(),
        name,
        companyName,
        logoUrl,
        primaryColor,
        secondaryColor,
        includeBreakdown,
        includeSummary,
        includeMonthlyChart,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error("Error saving report template:", error);
    return res.status(500).json({
      success: false,
      message: "Error saving report template"
    });
  }
});

// Get saved report templates
router.get('/templates', authenticate, async (req, res) => {
  try {
    // In a real implementation, this would retrieve from the database
    // For now, just return a sample template
    
    return res.json([
      {
        id: 1,
        name: "Default Template",
        companyName: "Your Company",
        logoUrl: "",
        primaryColor: "#3b82f6",
        secondaryColor: "#10b981",
        includeBreakdown: true,
        includeSummary: true,
        includeMonthlyChart: true,
        createdAt: new Date()
      }
    ]);
  } catch (error) {
    console.error("Error retrieving report templates:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving report templates"
    });
  }
});

// Create a shareable link for a report
router.post('/share', authenticate, async (req, res) => {
  try {
    const { reportType, reportId, expiresIn } = req.body;
    
    // In a real implementation, this would create a unique token and store in the database
    // For now, just generate a fake URL with timestamp
    
    const shareToken = `share_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const shareUrl = `/shared-report/${shareToken}`;
    
    return res.json({
      success: true,
      shareUrl,
      expiresAt: new Date(Date.now() + (expiresIn || 7) * 24 * 60 * 60 * 1000)
    });
  } catch (error) {
    console.error("Error creating shareable link:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating shareable link"
    });
  }
});

export default router;