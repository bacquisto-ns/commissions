import { db } from "@db";
import { and, asc, count, desc, eq, gt, gte, lte, sql, sum, isNull } from "drizzle-orm";
import {
  brokers, 
  commissions, 
  properties, 
  transactions, 
  type Broker, 
  type Commission, 
  type Property, 
  type Transaction,
  CommissionWithDetails,
  TransactionWithDetails
} from "@shared/schema";
import { addMonths, format, startOfMonth, endOfMonth, subMonths } from "date-fns";

// Define types for the dashboard data
type DashboardData = {
  totalYtd: string;
  totalLastYear: string;
  totalPending: string;
  pendingCount: number;
  avgCommissionRate: string;
  totalTransactions: number;
  recentCommissions: CommissionWithDetails[];
  monthlyEarnings: Array<{
    month: string;
    amount: number;
  }>;
  breakdownByType: Array<{
    type: string;
    percentage: number;
    amount: number;
  }>;
  topPropertyType: {
    name: string;
    percentage: number;
  };
};

// Type for commission queries
type CommissionQueryParams = {
  limit?: number;
  offset?: number;
  status?: string;
};

// Type for creating a new commission
type CreateCommissionData = {
  property: Omit<Property, 'id' | 'createdAt'>;
  transaction: Omit<Transaction, 'id' | 'propertyId' | 'createdAt'> & { totalCommission: string };
  commissions: Array<Omit<Commission, 'id' | 'transactionId' | 'amount' | 'createdAt' | 'updatedAt' | 'paymentDate'> & { amount: string }>;
};

// Define the storage interface
export const storage = {
  // Broker operations
  async getBrokerById(id: number): Promise<Broker | undefined> {
    const result = await db.select().from(brokers).where(eq(brokers.id, id));
    return result[0];
  },

  async getAllBrokers(): Promise<Broker[]> {
    return await db.select().from(brokers).where(eq(brokers.active, true));
  },

  // Commission operations
  async getBrokerCommissions(
    brokerId: number, 
    params: CommissionQueryParams = {}
  ): Promise<CommissionWithDetails[]> {
    let query = db.query.commissions.findMany({
      with: {
        transaction: {
          with: {
            property: true,
          },
        },
        broker: true,
      },
      where: eq(commissions.brokerId, brokerId),
      orderBy: [desc(commissions.createdAt)],
      limit: params.limit || 10,
      offset: params.offset || 0,
    });
    
    if (params.status && params.status !== 'all') {
      query = db.query.commissions.findMany({
        with: {
          transaction: {
            with: {
              property: true,
            },
          },
          broker: true,
        },
        where: and(
          eq(commissions.brokerId, brokerId),
          eq(commissions.status, params.status)
        ),
        orderBy: [desc(commissions.createdAt)],
        limit: params.limit || 10,
        offset: params.offset || 0,
      });
    }
    
    return await query;
  },

  async getBrokerCommissionsCount(brokerId: number, status?: string): Promise<number> {
    let query = db.select({ count: count() }).from(commissions).where(eq(commissions.brokerId, brokerId));
    
    if (status && status !== 'all') {
      query = db.select({ count: count() }).from(commissions).where(
        and(
          eq(commissions.brokerId, brokerId),
          eq(commissions.status, status)
        )
      );
    }
    
    const result = await query;
    return result[0]?.count || 0;
  },

  async getCommissionById(id: number): Promise<CommissionWithDetails | undefined> {
    const result = await db.query.commissions.findFirst({
      where: eq(commissions.id, id),
      with: {
        transaction: {
          with: {
            property: true,
          },
        },
        broker: true,
      },
    });
    
    return result;
  },

  async createCommission(data: CreateCommissionData): Promise<CommissionWithDetails> {
    // Start a transaction to ensure all operations succeed or fail together
    return await db.transaction(async (tx) => {
      // 1. Create the property
      const [property] = await tx.insert(properties).values(data.property).returning();
      
      // 2. Create the transaction
      const [transaction] = await tx.insert(transactions).values({
        ...data.transaction,
        propertyId: property.id,
      }).returning();
      
      // 3. Create the commissions
      const commissionsToInsert = data.commissions.map(commission => ({
        ...commission,
        transactionId: transaction.id,
      }));
      
      const insertedCommissions = await tx.insert(commissions).values(commissionsToInsert).returning();
      
      // 4. Return the first commission with details (in practice you might want to return all)
      const commissionWithDetails = await tx.query.commissions.findFirst({
        where: eq(commissions.id, insertedCommissions[0].id),
        with: {
          transaction: {
            with: {
              property: true,
            },
          },
          broker: true,
        },
      });
      
      if (!commissionWithDetails) {
        throw new Error("Failed to retrieve commission details after creation");
      }
      
      return commissionWithDetails;
    });
  },

  async updateCommissionStatus(
    id: number, 
    status: string,
    paymentDate: Date | null = null
  ): Promise<Commission | undefined> {
    let updateData: Partial<Commission> = {
      status: status as any,
      updatedAt: new Date(),
    };
    
    // If status is 'paid', set payment date to now if not provided
    if (status === 'paid' && !paymentDate) {
      updateData.paymentDate = new Date();
    } else {
      updateData.paymentDate = paymentDate;
    }
    
    const [updated] = await db
      .update(commissions)
      .set(updateData)
      .where(eq(commissions.id, id))
      .returning();
    
    return updated;
  },

  // Dashboard data
  async getDashboardData(brokerId: number): Promise<DashboardData> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    // Calculate YTD earnings
    const ytdStart = new Date(currentYear, 0, 1); // Jan 1 of current year
    const ytdEnd = new Date();
    
    const ytdResult = await db
      .select({ total: sum(commissions.amount) })
      .from(commissions)
      .where(
        and(
          eq(commissions.brokerId, brokerId),
          eq(commissions.status, 'paid'),
          gte(commissions.paymentDate, ytdStart),
          lte(commissions.paymentDate, ytdEnd)
        )
      );
    
    // Calculate last year's earnings
    const lastYearStart = new Date(currentYear - 1, 0, 1);
    const lastYearEnd = new Date(currentYear - 1, 11, 31);
    
    const lastYearResult = await db
      .select({ total: sum(commissions.amount) })
      .from(commissions)
      .where(
        and(
          eq(commissions.brokerId, brokerId),
          eq(commissions.status, 'paid'),
          gte(commissions.paymentDate, lastYearStart),
          lte(commissions.paymentDate, lastYearEnd)
        )
      );
    
    // Get pending commissions
    const pendingResult = await db
      .select({ total: sum(commissions.amount) })
      .from(commissions)
      .where(
        and(
          eq(commissions.brokerId, brokerId),
          eq(commissions.status, 'pending')
        )
      );
    
    const pendingCount = await db
      .select({ count: count() })
      .from(commissions)
      .where(
        and(
          eq(commissions.brokerId, brokerId),
          eq(commissions.status, 'pending')
        )
      );
    
    // Get average commission rate
    const avgRateResult = await db
      .select({
        avgRate: sql<string>`AVG(${transactions.commissionRate})::numeric(5,2)`
      })
      .from(transactions)
      .innerJoin(
        commissions,
        eq(commissions.transactionId, transactions.id)
      )
      .where(eq(commissions.brokerId, brokerId));
    
    // Get total transactions
    const transactionCount = await db
      .select({ count: count() })
      .from(commissions)
      .where(eq(commissions.brokerId, brokerId));
    
    // Get recent commissions
    const recentCommissions = await db.query.commissions.findMany({
      with: {
        transaction: {
          with: {
            property: true,
          },
        },
        broker: true,
      },
      where: eq(commissions.brokerId, brokerId),
      orderBy: [desc(commissions.createdAt)],
      limit: 5,
    });
    
    // Get last 6 months of earnings
    const monthlyEarnings = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(subMonths(new Date(), i));
      
      const monthResult = await db
        .select({ total: sum(commissions.amount) })
        .from(commissions)
        .where(
          and(
            eq(commissions.brokerId, brokerId),
            eq(commissions.status, 'paid'),
            gte(commissions.paymentDate, monthStart),
            lte(commissions.paymentDate, monthEnd)
          )
        );
      
      monthlyEarnings.push({
        month: format(monthStart, 'MMM'),
        amount: Number(monthResult[0]?.total || 0),
      });
    }
    
    // Get commission breakdown by property type
    const breakdownQuery = await db
      .select({
        propertyType: properties.propertyTypeGroup,
        amount: sum(commissions.amount),
      })
      .from(commissions)
      .innerJoin(
        transactions,
        eq(commissions.transactionId, transactions.id)
      )
      .innerJoin(
        properties,
        eq(transactions.propertyId, properties.id)
      )
      .where(eq(commissions.brokerId, brokerId))
      .groupBy(properties.propertyTypeGroup);
    
    // Calculate total for percentages
    const totalAmount = breakdownQuery.reduce((sum, item) => sum + Number(item.amount), 0);
    
    const breakdown = breakdownQuery.map(item => ({
      type: item.propertyType,
      amount: Number(item.amount),
      percentage: totalAmount > 0 ? (Number(item.amount) / totalAmount) * 100 : 0,
    }));
    
    // Add 'other' category if total doesn't reach 100%
    let otherPercentage = 100 - breakdown.reduce((sum, item) => sum + item.percentage, 0);
    if (otherPercentage > 0) {
      breakdown.push({
        type: 'other',
        amount: (totalAmount * otherPercentage) / 100,
        percentage: otherPercentage,
      });
    }
    
    // Get top property type
    const topPropertyQuery = await db
      .select({
        propertyType: properties.propertyType,
        amount: sum(commissions.amount),
      })
      .from(commissions)
      .innerJoin(
        transactions,
        eq(commissions.transactionId, transactions.id)
      )
      .innerJoin(
        properties,
        eq(transactions.propertyId, properties.id)
      )
      .where(eq(commissions.brokerId, brokerId))
      .groupBy(properties.propertyType)
      .orderBy(desc(sql`amount`))
      .limit(1);
    
    let topPropertyType = {
      name: "Unknown",
      percentage: 0,
    };
    
    if (topPropertyQuery.length > 0) {
      const propertyTypeReadable = topPropertyQuery[0].propertyType
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      topPropertyType = {
        name: propertyTypeReadable,
        percentage: totalAmount > 0 ? (Number(topPropertyQuery[0].amount) / totalAmount) * 100 : 0,
      };
    }
    
    return {
      totalYtd: ytdResult[0]?.total?.toString() || "0",
      totalLastYear: lastYearResult[0]?.total?.toString() || "0",
      totalPending: pendingResult[0]?.total?.toString() || "0",
      pendingCount: pendingCount[0]?.count || 0,
      avgCommissionRate: avgRateResult[0]?.avgRate || "0",
      totalTransactions: transactionCount[0]?.count || 0,
      recentCommissions,
      monthlyEarnings,
      breakdownByType: breakdown,
      topPropertyType,
    };
  },

  // Statistics
  async getCommissionStatistics(
    brokerId: number, 
    period: string = 'month', 
    count: number = 6
  ): Promise<any> {
    const now = new Date();
    const periods = [];
    
    // Generate date ranges based on the period
    if (period === 'month') {
      for (let i = count - 1; i >= 0; i--) {
        const start = startOfMonth(subMonths(now, i));
        const end = endOfMonth(subMonths(now, i));
        periods.push({
          label: format(start, 'MMM'),
          start,
          end,
        });
      }
    } else if (period === 'year') {
      for (let i = count - 1; i >= 0; i--) {
        const start = new Date(now.getFullYear() - i, 0, 1);
        const end = new Date(now.getFullYear() - i, 11, 31);
        periods.push({
          label: format(start, 'yyyy'),
          start,
          end,
        });
      }
    }
    
    // Get earnings for each period
    const earnings = [];
    for (const period of periods) {
      const result = await db
        .select({ total: sum(commissions.amount) })
        .from(commissions)
        .where(
          and(
            eq(commissions.brokerId, brokerId),
            eq(commissions.status, 'paid'),
            gte(commissions.paymentDate, period.start),
            lte(commissions.paymentDate, period.end)
          )
        );
      
      earnings.push({
        period: period.label,
        amount: Number(result[0]?.total || 0),
      });
    }
    
    // Get property type breakdown
    const typeBreakdown = await db
      .select({
        propertyType: properties.propertyTypeGroup,
        amount: sum(commissions.amount),
      })
      .from(commissions)
      .innerJoin(
        transactions,
        eq(commissions.transactionId, transactions.id)
      )
      .innerJoin(
        properties,
        eq(transactions.propertyId, properties.id)
      )
      .where(eq(commissions.brokerId, brokerId))
      .groupBy(properties.propertyTypeGroup);
    
    // Calculate total for percentages
    const totalAmount = typeBreakdown.reduce((sum, item) => sum + Number(item.amount), 0);
    
    const typeBreakdownWithPercentages = typeBreakdown.map(item => ({
      type: item.propertyType,
      amount: Number(item.amount),
      percentage: totalAmount > 0 ? (Number(item.amount) / totalAmount) * 100 : 0,
    }));
    
    return {
      earnings,
      typeBreakdown: typeBreakdownWithPercentages,
    };
  }
};
