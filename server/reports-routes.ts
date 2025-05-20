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
      
      // Get real commission statistics for the broker
      const statistics = await storage.getCommissionStatistics(brokerId, {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });
      
      // Get broker commissions for detailed transaction data
      const commissions = await storage.getBrokerCommissions(brokerId, {
        limit: 100,
        offset: 0
      });
      
      // Format the commissions data for the report
      const transactions = commissions.map(commission => {
        return {
          id: commission.id,
          productType: commission.transaction.benefitProgram.programType.toUpperCase(),
          employer: commission.transaction.benefitProgram.organization.name,
          participants: commission.transaction.participantCount || 0,
          rate: commission.transaction.rate || '0',
          status: commission.status,
          amount: commission.amount,
          transactionDate: commission.transaction.transactionDate,
          transactionType: commission.transaction.transactionType
        };
      });
      
      // Group transactions by product type for breakdown
      const productBreakdown = transactions.reduce((acc, transaction) => {
        const productType = transaction.productType;
        if (!acc[productType]) {
          acc[productType] = {
            product: productType,
            amount: 0,
            count: 0
          };
        }
        acc[productType].amount += parseFloat(transaction.amount.toString());
        acc[productType].count += 1;
        return acc;
      }, {});
      
      // Calculate percentage for each product
      const totalAmount = Object.values(productBreakdown).reduce((sum, item: any) => sum + item.amount, 0);
      const commissionsByProduct = Object.values(productBreakdown).map((item: any) => ({
        product: item.product,
        amount: item.amount,
        percentage: totalAmount > 0 ? Math.round((item.amount / totalAmount) * 100) : 0
      }));
      
      // Calculate monthly breakdown
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 5);
      
      const monthlyData = {};
      for (let i = 0; i < 6; i++) {
        const monthDate = new Date(sixMonthsAgo);
        monthDate.setMonth(sixMonthsAgo.getMonth() + i);
        const monthKey = monthDate.toLocaleString('default', { month: 'short' });
        monthlyData[monthKey] = 0;
      }
      
      transactions.forEach(transaction => {
        const txDate = new Date(transaction.transactionDate);
        const month = txDate.toLocaleString('default', { month: 'short' });
        if (monthlyData[month] !== undefined) {
          monthlyData[month] += parseFloat(transaction.amount.toString());
        }
      });
      
      const monthlyEarnings = Object.entries(monthlyData).map(([month, amount]) => ({
        month,
        amount: Number(amount)
      }));
      
      // Format the final report data
      reportData = {
        brokerInfo,
        commissions: transactions,
        statistics: {
          totalCommission: statistics.total || "$0.00",
          pendingCommission: statistics.pendingAmount || "$0.00",
          approvedCommission: statistics.approvedAmount || "$0.00",
          transactionCount: transactions.length,
          avgCommissionRate: statistics.avgRate || "$0.00",
          commissionsByProduct,
          monthlyEarnings
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
      
      // Get agency dashboard data that includes aggregated statistics
      const dashboardData = await storage.getAgencyDashboardData(agencyId);
      
      // Collect all commissions for this agency's brokers
      const allCommissions = [];
      for (const broker of brokers) {
        const brokerCommissions = await storage.getBrokerCommissions(broker.id, {
          limit: 100,
          offset: 0
        });
        allCommissions.push(...brokerCommissions);
      }
      
      // Format the commissions data for the report
      const transactions = allCommissions.map(commission => {
        return {
          id: commission.id,
          brokerId: commission.brokerId,
          brokerName: brokers.find(b => b.id === commission.brokerId) 
            ? `${brokers.find(b => b.id === commission.brokerId).firstName} ${brokers.find(b => b.id === commission.brokerId).lastName}`
            : 'Unassigned',
          productType: commission.transaction.benefitProgram.programType.toUpperCase(),
          employer: commission.transaction.benefitProgram.organization.name,
          participants: commission.transaction.participantCount || 0,
          rate: commission.transaction.rate || '0',
          status: commission.status,
          amount: commission.amount,
          transactionDate: commission.transaction.transactionDate,
          transactionType: commission.transaction.transactionType
        };
      });
      
      // Group transactions by product type for breakdown
      const productBreakdown = transactions.reduce((acc, transaction) => {
        const productType = transaction.productType;
        if (!acc[productType]) {
          acc[productType] = {
            product: productType,
            amount: 0,
            count: 0
          };
        }
        acc[productType].amount += parseFloat(transaction.amount.toString());
        acc[productType].count += 1;
        return acc;
      }, {});
      
      // Calculate percentage for each product
      const totalAmount = Object.values(productBreakdown).reduce((sum, item: any) => sum + item.amount, 0);
      const commissionsByProduct = Object.values(productBreakdown).map((item: any) => ({
        product: item.product,
        amount: item.amount,
        percentage: totalAmount > 0 ? Math.round((item.amount / totalAmount) * 100) : 0
      }));
      
      // Calculate monthly breakdown
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 5);
      
      const monthlyData = {};
      for (let i = 0; i < 6; i++) {
        const monthDate = new Date(sixMonthsAgo);
        monthDate.setMonth(sixMonthsAgo.getMonth() + i);
        const monthKey = monthDate.toLocaleString('default', { month: 'short' });
        monthlyData[monthKey] = 0;
      }
      
      transactions.forEach(transaction => {
        const txDate = new Date(transaction.transactionDate);
        const month = txDate.toLocaleString('default', { month: 'short' });
        if (monthlyData[month] !== undefined) {
          monthlyData[month] += parseFloat(transaction.amount.toString());
        }
      });
      
      const monthlyEarnings = Object.entries(monthlyData).map(([month, amount]) => ({
        month,
        amount: Number(amount)
      }));
      
      // Generate broker performance metrics for the report
      const brokerPerformance = brokers.map(broker => {
        const brokerTransactions = transactions.filter(t => t.brokerId === broker.id);
        const totalCommissions = brokerTransactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
        const pendingCommissions = brokerTransactions
          .filter(t => t.status === 'pending')
          .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
        
        return {
          brokerId: broker.id,
          firstName: broker.firstName,
          lastName: broker.lastName,
          totalCommissions,
          pendingCommissions,
          percentageOfTotal: totalAmount > 0 ? Math.round((totalCommissions / totalAmount) * 100) : 0
        };
      }).sort((a, b) => b.totalCommissions - a.totalCommissions);
      
      reportData = {
        agencyInfo,
        brokers,
        commissions: transactions,
        brokerPerformance,
        statistics: {
          totalCommission: dashboardData.totalYtd || "$0.00",
          pendingCommission: dashboardData.totalPending || "$0.00",
          approvedCommission: (parseFloat(dashboardData.totalYtd.replace('$', '').replace(',', '')) - 
                              parseFloat(dashboardData.totalPending.replace('$', '').replace(',', ''))).toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD'
                              }),
          transactionCount: dashboardData.totalTransactions || 0,
          brokerCount: brokers.length,
          avgCommissionRate: dashboardData.avgCommissionRate || "$0.00",
          commissionsByProduct,
          monthlyEarnings
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