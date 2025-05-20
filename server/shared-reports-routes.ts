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
    const { reportType, entityId, startDate, endDate, expireDays = 7 } = req.body;
    
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
        companyName: agencyName || 'Independent Broker',
        primaryColor: '#3b82f6',
        secondaryColor: '#10b981',
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
      
      // Get agency commissions (this would be the sum of all broker commissions)
      // In a real implementation, we'd have a specific query for this
      // For demo purposes, we'll use placeholder data
      const transactions = brokers.slice(0, 3).flatMap(broker => {
        return [
          {
            productType: 'COBRA',
            employer: 'ABC Company',
            participants: 50,
            rate: '0.75',
            status: 'Approved',
            amount: '37.50',
            broker: `${broker.firstName} ${broker.lastName}`
          },
          {
            productType: 'FSA',
            employer: 'XYZ Corporation',
            participants: 25,
            rate: '2.00',
            status: 'Pending',
            amount: '50.00',
            broker: `${broker.firstName} ${broker.lastName}`
          }
        ];
      });
      
      // Assemble the final report data
      reportData = {
        companyName: agency.name,
        primaryColor: '#3b82f6',
        secondaryColor: '#10b981',
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