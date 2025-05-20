import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { storage } from './storage';

const router = express.Router();

// In-memory store for shareable reports (in a production app, this would be in the database)
interface SharedReport {
  id: string;
  reportData: any;
  expiresAt: Date;
}

// For demo purposes, we'll use an in-memory store
// In a real app, this would be stored in the database
const sharedReports = new Map<string, SharedReport>();

// Create a shareable report
router.post('/api/shared-reports', async (req: Request, res: Response) => {
  try {
    const { 
      reportType, 
      entityId, 
      startDate, 
      endDate, 
      expireDays = 7,
      // Branding parameters
      companyName,
      logoUrl,
      primaryColor,
      secondaryColor,
      reportLayout = 'standard',
      reportFormat = 'detailed',
      includeCharts = true,
      includeDetails = true
    } = req.body;
    
    if (!reportType || !entityId || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters: reportType, entityId, startDate, endDate' 
      });
    }
    
    // Fetch the report data based on type
    let reportData: any;
    if (reportType === 'broker') {
      // Get the broker's information and commission data
      const broker = await storage.getBrokerById(Number(entityId));
      if (!broker) {
        return res.status(404).json({ success: false, message: 'Broker not found' });
      }
      
      // Get commission statistics
      const statistics = await storage.getCommissionStatistics({
        brokerId: Number(entityId),
        type: 'all',
        timeframe: 'custom',
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });
      
      // Get the agency name if the broker belongs to one
      let agencyName = '';
      if (broker.agencyId) {
        const agency = await storage.getAgencyById(broker.agencyId);
        agencyName = agency?.name || '';
      }
      
      // Get transaction details for the period
      const commissions = await storage.getBrokerCommissions({
        brokerId: Number(entityId),
        startDate,
        endDate,
        limit: 100,
        offset: 0
      });
      
      // Format transactions data
      const transactions = commissions.data.map(commission => {
        const transaction = commission.transaction;
        return {
          productType: transaction.benefitProgram.programType.toUpperCase().replace('_', ' '),
          employer: transaction.benefitProgram.organization.name,
          participants: transaction.participantCount,
          rate: transaction.rate || '0.75',
          status: commission.status,
          amount: commission.amount
        };
      });
      
      // Assemble the final report data
      reportData = {
        // Custom branding
        companyName: companyName || agencyName || 'Independent Broker',
        logoUrl: logoUrl || '',
        primaryColor: primaryColor || '#3b82f6',
        secondaryColor: secondaryColor || '#10b981',
        reportLayout: reportLayout || 'standard',
        reportFormat: reportFormat || 'detailed',
        includeCharts: includeCharts !== undefined ? includeCharts : true,
        includeDetails: includeDetails !== undefined ? includeDetails : true,
        
        // Report content
        reportType: 'broker',
        entityName: `${broker.firstName} ${broker.lastName}`,
        period: {
          startDate,
          endDate
        },
        summary: {
          totalCommissions: statistics.total,
          pendingApprovals: {
            count: statistics.pendingCount,
            amount: statistics.pendingAmount
          },
          transactions: {
            count: statistics.transactionCount,
            avgRate: statistics.avgRate
          }
        },
        productBreakdown: {
          topProduct: {
            name: statistics.topProductType?.name || 'COBRA',
            percentage: statistics.topProductType?.percentage || 100
          }
        },
        transactions
      };
    } else if (reportType === 'agency') {
      // Get the agency's information and commission data
      const agency = await storage.getAgencyById(Number(entityId));
      if (!agency) {
        return res.status(404).json({ success: false, message: 'Agency not found' });
      }
      
      // Get agency dashboard data 
      const dashboardData = await storage.getAgencyDashboardData(Number(entityId));
      
      // Get the agency's brokers
      const brokers = await storage.getBrokersForAgency(Number(entityId));
      
      // Collect all commissions for this agency's brokers
      const allCommissions = [];
      for (const broker of brokers) {
        try {
          const brokerCommissions = await storage.getBrokerCommissions(broker.id, {
            limit: 100,
            offset: 0
          });
          if (brokerCommissions) {
            allCommissions.push(...brokerCommissions);
          }
        } catch (error) {
          console.error(`Error fetching commissions for broker ${broker.id}:`, error);
        }
      }
      
      // Format the commissions data for the report
      const transactions = allCommissions.map(commission => {
        const transaction = commission.transaction;
        return {
          productType: transaction.benefitProgram.programType.toUpperCase().replace('_', ' '),
          employer: transaction.benefitProgram.organization.name,
          participants: transaction.participantCount || 0,
          rate: transaction.rate || transaction.commissionRate || '0.00',
          status: commission.status,
          amount: commission.amount,
          broker: brokers.find(b => b.id === commission.brokerId)
            ? `${brokers.find(b => b.id === commission.brokerId).firstName} ${brokers.find(b => b.id === commission.brokerId).lastName}`
            : 'Unassigned'
        };
      });
      
      // Assemble the final report data
      reportData = {
        // Custom branding
        companyName: companyName || agency.name,
        logoUrl: logoUrl || '',
        primaryColor: primaryColor || '#3b82f6',
        secondaryColor: secondaryColor || '#10b981',
        reportLayout: reportLayout || 'standard',
        reportFormat: reportFormat || 'detailed',
        includeCharts: includeCharts !== undefined ? includeCharts : true,
        includeDetails: includeDetails !== undefined ? includeDetails : true,
        
        // Report content
        reportType: 'agency',
        entityName: agency.name,
        period: {
          startDate,
          endDate
        },
        summary: {
          totalCommissions: dashboardData.totalYtd,
          pendingApprovals: {
            count: dashboardData.pendingCount,
            amount: dashboardData.totalPending
          },
          transactions: {
            count: dashboardData.totalTransactions,
            avgRate: dashboardData.avgCommissionRate
          }
        },
        productBreakdown: {
          topProduct: {
            name: dashboardData.topPropertyType?.name || 'COBRA',
            percentage: dashboardData.topPropertyType?.percentage || 100
          }
        },
        transactions,
        brokerPerformance: dashboardData.brokerPerformance
      };
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid report type. Must be either "broker" or "agency".' 
      });
    }
    
    // Generate a unique ID for the report
    const reportId = crypto.randomBytes(16).toString('hex');
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expireDays || 7));
    
    // Store the report in our in-memory store
    sharedReports.set(reportId, {
      id: reportId,
      reportData,
      expiresAt
    });
    
    // In a real application, we would save this to the database
    
    // Return the shareable link
    return res.status(200).json({
      success: true,
      reportId,
      shareableLink: `${req.protocol}://${req.get('host')}/shared-report/${reportId}`,
      expiresAt
    });
    
  } catch (error) {
    console.error('Error creating shared report:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to create shareable report' 
    });
  }
});

// Get a shared report by ID (publicly accessible, no authentication required)
router.get('/api/shared-reports/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if the report exists and hasn't expired
    const report = sharedReports.get(id);
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: 'Shared report not found or has expired' 
      });
    }
    
    // Check if the report has expired
    if (new Date() > report.expiresAt) {
      // Remove the expired report
      sharedReports.delete(id);
      
      return res.status(404).json({ 
        success: false, 
        message: 'Shared report has expired' 
      });
    }
    
    // Return the report data
    return res.status(200).json(report.reportData);
    
  } catch (error) {
    console.error('Error retrieving shared report:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve shared report' 
    });
  }
});

export default router;