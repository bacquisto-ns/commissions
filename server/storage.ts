import { db } from "@db";
import { and, asc, count, desc, eq, gt, gte, lte, sql, sum, isNull } from "drizzle-orm";
import {
  brokers, 
  commissions, 
  benefitPrograms,
  organizations,
  transactions,
  products,
  agencies,
  commissionStructures,
  type Broker, 
  type Commission, 
  type Organization,
  type BenefitProgram,
  type Transaction,
  type Product,
  type ProductInsert,
  type Agency,
  type AgencyWithBrokerCount,
  type AgencyInsert,
  type CommissionStructure,
  type CommissionStructureInsert,
  CommissionWithDetails,
  TransactionWithDetails,
  BrokerWithAgency,
  ProductWithCommissionStructure
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

// Define type for the agency dashboard data
type AgencyDashboardData = {
  totalYtd: string;
  totalLastYear: string;
  totalPending: string;
  pendingCount: number;
  avgCommissionRate: string;
  totalTransactions: number;
  brokerCount: number;
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
  brokerPerformance?: Array<{
    brokerId: number;
    firstName: string;
    lastName: string;
    totalCommissions: number;
    pendingCommissions: number;
    percentageOfTotal: number;
  }>;
};

// Type for commission queries
type CommissionQueryParams = {
  limit?: number;
  offset?: number;
  status?: string;
};

// Type for creating a new commission
type CreateCommissionData = {
  organization: Omit<Organization, 'id' | 'createdAt'>;
  benefitProgram: Omit<BenefitProgram, 'id' | 'organizationId' | 'createdAt'>;
  transaction: Omit<Transaction, 'id' | 'benefitProgramId' | 'createdAt'> & { totalCommission: string };
  commissions: Array<Omit<Commission, 'id' | 'transactionId' | 'amount' | 'createdAt' | 'updatedAt' | 'paymentDate'> & { amount: string }>;
};

// Define the storage interface
export const storage = {
  // Broker operations
  async getBrokerById(id: number): Promise<BrokerWithAgency | undefined> {
    const result = await db.query.brokers.findFirst({
      where: eq(brokers.id, id),
      with: {
        agency: true
      }
    });
    return result;
  },

  async getAllBrokers(): Promise<BrokerWithAgency[]> {
    return await db.query.brokers.findMany({
      where: eq(brokers.active, true),
      with: {
        agency: true
      },
      orderBy: [asc(brokers.lastName), asc(brokers.firstName)]
    });
  },
  
  async updateBroker(brokerId: number, brokerData: Partial<Broker>): Promise<Broker | undefined> {
    const [updatedBroker] = await db
      .update(brokers)
      .set(brokerData)
      .where(eq(brokers.id, brokerId))
      .returning();
    
    return updatedBroker;
  },

  // Agency operations
  async getAllAgencies(): Promise<AgencyWithBrokerCount[]> {
    const allAgencies = await db.select().from(agencies).orderBy(agencies.name);
    
    // For each agency, count the number of brokers
    const agenciesWithBrokerCount = await Promise.all(
      allAgencies.map(async (agency) => {
        const brokerCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(brokers)
          .where(eq(brokers.agencyId, agency.id))
          .then(result => result[0]?.count || 0);
        
        return {
          ...agency,
          brokerCount
        } as AgencyWithBrokerCount;
      })
    );
    
    return agenciesWithBrokerCount;
  },

  async getAgencyById(id: number): Promise<AgencyWithBrokerCount | undefined> {
    const result = await db.select().from(agencies).where(eq(agencies.id, id));
    
    if (!result[0]) {
      return undefined;
    }
    
    // Count the number of brokers for this agency
    const brokerCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(brokers)
      .where(eq(brokers.agencyId, id))
      .then(result => result[0]?.count || 0);
    
    return {
      ...result[0],
      brokerCount
    } as AgencyWithBrokerCount;
  },

  async createAgency(agencyData: AgencyInsert): Promise<Agency> {
    const [newAgency] = await db
      .insert(agencies)
      .values({
        ...agencyData,
        active: true,
        updatedAt: new Date()
      })
      .returning();
    
    return newAgency;
  },

  async updateAgency(agencyId: number, agencyData: Partial<Agency>): Promise<Agency | undefined> {
    const [updatedAgency] = await db
      .update(agencies)
      .set({
        ...agencyData,
        updatedAt: new Date()
      })
      .where(eq(agencies.id, agencyId))
      .returning();
    
    return updatedAgency;
  },

  async getBrokersForAgency(agencyId: number): Promise<BrokerWithAgency[]> {
    return await db.query.brokers.findMany({
      where: eq(brokers.agencyId, agencyId),
      with: {
        agency: true
      },
      orderBy: [asc(brokers.lastName), asc(brokers.firstName)]
    });
  },

  // Agency Dashboard data
  async getAgencyDashboardData(agencyId: number): Promise<AgencyDashboardData> {
    // Get brokers in this agency
    const agencyBrokers = await db.query.brokers.findMany({
      where: eq(brokers.agencyId, agencyId),
    });
    
    const brokerIds = agencyBrokers.map(broker => broker.id);
    
    // Skip additional calculations if there are no brokers in this agency
    if (brokerIds.length === 0) {
      return {
        totalYtd: "0",
        totalLastYear: "0",
        totalPending: "0",
        pendingCount: 0,
        avgCommissionRate: "0",
        totalTransactions: 0,
        brokerCount: 0,
        monthlyEarnings: [],
        breakdownByType: [],
        topPropertyType: {
          name: "None",
          percentage: 0
        },
        brokerPerformance: []
      };
    }
    
    // Current year data
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1); // January 1st of current year
    
    // Get YTD commissions for all brokers in the agency
    const ytdResult = await db
      .select({
        total: sql<string>`SUM(CAST(${commissions.amount} AS DECIMAL))`,
      })
      .from(commissions)
      .innerJoin(
        transactions,
        eq(commissions.transactionId, transactions.id)
      )
      .where(
        and(
          gte(transactions.transactionDate, startOfYear),
          sql`${commissions.brokerId} IN (${brokerIds.join(',')})`
        )
      );
    
    // Get last year's commissions
    const lastYear = currentYear - 1;
    const startOfLastYear = new Date(lastYear, 0, 1);
    const endOfLastYear = new Date(lastYear, 11, 31);
    
    const lastYearResult = await db
      .select({
        total: sql<string>`SUM(CAST(${commissions.amount} AS DECIMAL))`,
      })
      .from(commissions)
      .innerJoin(
        transactions,
        eq(commissions.transactionId, transactions.id)
      )
      .where(
        and(
          gte(transactions.transactionDate, startOfLastYear),
          lte(transactions.transactionDate, endOfLastYear),
          sql`${commissions.brokerId} IN (${brokerIds.join(',')})`
        )
      );
    
    // Get pending commissions
    const pendingResult = await db
      .select({
        total: sql<string>`SUM(CAST(${commissions.amount} AS DECIMAL))`,
      })
      .from(commissions)
      .where(
        and(
          eq(commissions.status, "pending"),
          sql`${commissions.brokerId} IN (${brokerIds.join(',')})`
        )
      );
    
    // Count pending transactions
    const pendingCount = await db
      .select({
        count: count(),
      })
      .from(commissions)
      .where(
        and(
          eq(commissions.status, "pending"),
          sql`${commissions.brokerId} IN (${brokerIds.join(',')})`
        )
      );
    
    // Get average commission rate
    const avgRateResult = await db
      .select({
        avgRate: sql<string>`AVG(CAST(${transactions.commissionRate} AS DECIMAL))`,
      })
      .from(transactions)
      .innerJoin(
        commissions,
        eq(commissions.transactionId, transactions.id)
      )
      .where(sql`${commissions.brokerId} IN (${brokerIds.join(',')})`)
      .limit(1);
    
    // Count total transactions
    const transactionCount = await db
      .select({
        count: count(),
      })
      .from(transactions)
      .innerJoin(
        commissions,
        eq(commissions.transactionId, transactions.id)
      )
      .where(sql`${commissions.brokerId} IN (${brokerIds.join(',')})`);
    
    // Get monthly earnings for current year
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyEarnings = await Promise.all(
      Array.from({ length: 12 }, async (_, monthIndex) => {
        const startDate = new Date(currentYear, monthIndex, 1);
        const endDate = new Date(currentYear, monthIndex + 1, 0);
        
        // Skip future months
        if (startDate > new Date()) {
          return {
            month: monthNames[monthIndex],
            amount: 0,
          };
        }
        
        const result = await db
          .select({
            total: sql<string>`SUM(CAST(${commissions.amount} AS DECIMAL))`,
          })
          .from(commissions)
          .innerJoin(
            transactions,
            eq(commissions.transactionId, transactions.id)
          )
          .where(
            and(
              gte(transactions.transactionDate, startDate),
              lte(transactions.transactionDate, endDate),
              sql`${commissions.brokerId} IN (${brokerIds.join(',')})`
            )
          );
        
        return {
          month: monthNames[monthIndex],
          amount: result[0]?.total ? Number(result[0].total) : 0,
        };
      })
    );
    
    // Get commission breakdown by program type
    const programBreakdown = await db
      .select({
        programType: benefitPrograms.programType,
        amount: sql<string>`SUM(CAST(${commissions.amount} AS DECIMAL))`,
      })
      .from(commissions)
      .innerJoin(
        transactions,
        eq(commissions.transactionId, transactions.id)
      )
      .innerJoin(
        benefitPrograms,
        eq(transactions.benefitProgramId, benefitPrograms.id)
      )
      .where(sql`${commissions.brokerId} IN (${brokerIds.join(',')})`)
      .groupBy(benefitPrograms.programType)
      .orderBy(desc(sql`SUM(CAST(${commissions.amount} AS DECIMAL))`));
    
    // Calculate total amount for percentage calculations
    const totalAmount = programBreakdown.reduce((sum, item) => sum + Number(item.amount), 0);
    
    // Format the breakdown with percentages
    const breakdown = programBreakdown.map(item => {
      const programTypeReadable = item.programType
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      return {
        type: programTypeReadable,
        amount: Number(item.amount),
        percentage: totalAmount > 0 ? (Number(item.amount) / totalAmount) * 100 : 0,
      };
    });
    
    // Get top program type
    let topPropertyType = {
      name: "Unknown",
      percentage: 0,
    };
    
    if (programBreakdown.length > 0) {
      const programTypeReadable = programBreakdown[0].programType
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      topPropertyType = {
        name: programTypeReadable,
        percentage: totalAmount > 0 ? (Number(programBreakdown[0].amount) / totalAmount) * 100 : 0,
      };
    }
    
    // Get broker performance data
    const brokerPerformance = await Promise.all(
      agencyBrokers.map(async (broker) => {
        // Get YTD commissions for this broker
        const totalCommissionsResult = await db
          .select({
            total: sql<string>`SUM(CAST(${commissions.amount} AS DECIMAL))`,
          })
          .from(commissions)
          .innerJoin(
            transactions,
            eq(commissions.transactionId, transactions.id)
          )
          .where(
            and(
              eq(commissions.brokerId, broker.id),
              gte(transactions.transactionDate, startOfYear)
            )
          );
        
        // Get pending commissions for this broker
        const pendingCommissionsResult = await db
          .select({
            total: sql<string>`SUM(CAST(${commissions.amount} AS DECIMAL))`,
          })
          .from(commissions)
          .innerJoin(
            transactions,
            eq(commissions.transactionId, transactions.id)
          )
          .where(
            and(
              eq(commissions.brokerId, broker.id),
              eq(commissions.status, "pending")
            )
          );
        
        const totalCommissions = totalCommissionsResult[0]?.total 
          ? Number(totalCommissionsResult[0].total) 
          : 0;
        
        const pendingCommissions = pendingCommissionsResult[0]?.total 
          ? Number(pendingCommissionsResult[0].total) 
          : 0;
        
        return {
          brokerId: broker.id,
          firstName: broker.firstName,
          lastName: broker.lastName,
          totalCommissions,
          pendingCommissions,
          percentageOfTotal: totalAmount > 0 ? (totalCommissions / totalAmount) * 100 : 0,
        };
      })
    );
    
    return {
      totalYtd: ytdResult[0]?.total?.toString() || "0",
      totalLastYear: lastYearResult[0]?.total?.toString() || "0",
      totalPending: pendingResult[0]?.total?.toString() || "0",
      pendingCount: pendingCount[0]?.count || 0,
      avgCommissionRate: avgRateResult[0]?.avgRate || "0",
      totalTransactions: transactionCount[0]?.count || 0,
      brokerCount: agencyBrokers.length,
      monthlyEarnings,
      breakdownByType: breakdown,
      topPropertyType,
      brokerPerformance,
    };
  },
  
  // Commission Structure operations
  async getAllCommissionStructures(): Promise<CommissionStructure[]> {
    return await db.select().from(commissionStructures).orderBy(commissionStructures.name);
  },
  
  async getCommissionStructureById(id: number): Promise<CommissionStructure | undefined> {
    const result = await db.select().from(commissionStructures).where(eq(commissionStructures.id, id));
    return result[0];
  },
  
  async createCommissionStructure(structureData: CommissionStructureInsert): Promise<CommissionStructure> {
    const [newStructure] = await db
      .insert(commissionStructures)
      .values({
        ...structureData,
        active: true,
        updatedAt: new Date()
      })
      .returning();
    
    return newStructure;
  },
  
  async updateCommissionStructure(structureId: number, structureData: Partial<CommissionStructure>): Promise<CommissionStructure | undefined> {
    const [updatedStructure] = await db
      .update(commissionStructures)
      .set({
        ...structureData,
        updatedAt: new Date()
      })
      .where(eq(commissionStructures.id, structureId))
      .returning();
    
    return updatedStructure;
  },
  
  // Product operations
  async getAllProducts(): Promise<ProductWithCommissionStructure[]> {
    return await db.query.products.findMany({
      orderBy: [asc(products.name)],
      with: {
        commissionStructure: true
      }
    });
  },
  
  async getProductById(id: number): Promise<ProductWithCommissionStructure | undefined> {
    return await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        commissionStructure: true
      }
    });
  },
  
  async createProduct(productData: ProductInsert): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values({
        ...productData,
        active: true,
        updatedAt: new Date()
      })
      .returning();
    
    return newProduct;
  },
  
  async updateProduct(productId: number, productData: Partial<Product>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({
        ...productData,
        updatedAt: new Date()
      })
      .where(eq(products.id, productId))
      .returning();
    
    return updatedProduct;
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
            benefitProgram: {
              with: {
                organization: true
              }
            }
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
              benefitProgram: {
                with: {
                  organization: true
                }
              }
            }
          },
          broker: true,
        },
        where: and(
          eq(commissions.brokerId, brokerId),
          eq(commissions.status, params.status as any)
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
          eq(commissions.status, status as any)
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
            benefitProgram: {
              with: {
                organization: true
              }
            }
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
      // 1. Create the organization
      const [organization] = await tx.insert(organizations).values(data.organization).returning();
      
      // 2. Create the benefit program
      // Ensure participant minimum is a number
      const benefitProgramData = {
        ...data.benefitProgram,
        organizationId: organization.id,
        participantMinimum: parseInt(data.benefitProgram.participantMinimum.toString()),
      };
      
      console.log("Benefit program data:", JSON.stringify(benefitProgramData, null, 2));
      
      const [benefitProgram] = await tx.insert(benefitPrograms).values(benefitProgramData).returning();
      
      // 3. Create the transaction
      // Ensure numeric fields are converted properly
      const transactionData = {
        ...data.transaction,
        benefitProgramId: benefitProgram.id,
        participantCount: parseInt(data.transaction.participantCount.toString()),
        // For decimal fields, ensure they're properly formatted strings
        commissionRate: data.transaction.commissionRate,
        totalCommission: data.transaction.totalCommission,
      };
      
      console.log("Transaction data:", JSON.stringify(transactionData, null, 2));
      
      const [transaction] = await tx.insert(transactions).values(transactionData).returning();
      
      // 4. Create the commissions
      // First, let's get a list of valid broker IDs from the database
      const brokersResults = await tx.select({ id: brokers.id }).from(brokers);
      const validBrokerIds = brokersResults.map(broker => broker.id);
      
      // Filter commissions: only keep those with valid broker IDs or null brokerIds
      const validCommissions = data.commissions.filter(commission => {
        // Allow null broker IDs or valid broker IDs in the database
        return commission.brokerId === null || validBrokerIds.includes(commission.brokerId);
      });
      
      // If no valid commissions, use the first valid broker ID
      if (validCommissions.length === 0 && validBrokerIds.length > 0) {
        // Create a default commission with the first valid broker
        validCommissions.push({
          brokerId: validBrokerIds[0],
          splitPercentage: "100",
          status: "pending" as any,
          notes: null,
          amount: data.transaction.totalCommission
        });
      }
      
      const commissionsToInsert = validCommissions.map(commission => {
        // Ensure splitPercentage and amount are properly formatted for PostgreSQL
        let splitPct: string = '';
        if (commission.splitPercentage !== undefined) {
          splitPct = typeof commission.splitPercentage === 'string'
            ? commission.splitPercentage
            : String(commission.splitPercentage);
        } else {
          splitPct = '0';
        }
          
        let amountStr: string = '';
        if (commission.amount !== undefined) {
          amountStr = typeof commission.amount === 'string'
            ? commission.amount
            : String(commission.amount);
        } else {
          amountStr = '0';
        }
          
        return {
          ...commission,
          transactionId: transaction.id,
          splitPercentage: splitPct,
          amount: amountStr
        };
      });
      
      console.log("Commission data:", JSON.stringify(commissionsToInsert, null, 2));
      
      const insertedCommissions = await tx.insert(commissions).values(commissionsToInsert).returning();
      
      // 5. Return the first commission with details (in practice you might want to return all)
      const commissionWithDetails = await tx.query.commissions.findFirst({
        where: eq(commissions.id, insertedCommissions[0].id),
        with: {
          transaction: {
            with: {
              benefitProgram: {
                with: {
                  organization: true
                }
              }
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
    
    // If status is 'approved', set payment date to now if not provided
    if (status === 'approved' && !paymentDate) {
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
    
    // Calculate YTD earnings (using transaction date to match agency dashboard)
    const ytdStart = new Date(currentYear, 0, 1); // Jan 1 of current year
    const ytdEnd = new Date();
    
    const ytdResult = await db
      .select({ total: sql<string>`SUM(CAST(${commissions.amount} AS DECIMAL))` })
      .from(commissions)
      .innerJoin(
        transactions,
        eq(commissions.transactionId, transactions.id)
      )
      .where(
        and(
          eq(commissions.brokerId, brokerId),
          gte(transactions.transactionDate, ytdStart),
          lte(transactions.transactionDate, ytdEnd)
        )
      );
    
    // Calculate last year's earnings
    const lastYearStart = new Date(currentYear - 1, 0, 1);
    const lastYearEnd = new Date(currentYear - 1, 11, 31);
    
    const lastYearResult = await db
      .select({ total: sql<string>`SUM(CAST(${commissions.amount} AS DECIMAL))` })
      .from(commissions)
      .innerJoin(
        transactions,
        eq(commissions.transactionId, transactions.id)
      )
      .where(
        and(
          eq(commissions.brokerId, brokerId),
          gte(transactions.transactionDate, lastYearStart),
          lte(transactions.transactionDate, lastYearEnd)
        )
      );
    
    // Get pending commissions
    const pendingResult = await db
      .select({ total: sql<string>`SUM(CAST(${commissions.amount} AS DECIMAL))` })
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
        avgRate: sql<string>`AVG(CAST(${transactions.commissionRate} AS DECIMAL))::numeric(5,2)`
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
            benefitProgram: {
              with: {
                organization: true
              }
            }
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
        .select({ total: sql<string>`SUM(CAST(${commissions.amount} AS DECIMAL))` })
        .from(commissions)
        .innerJoin(
          transactions,
          eq(commissions.transactionId, transactions.id)
        )
        .where(
          and(
            eq(commissions.brokerId, brokerId),
            gte(transactions.transactionDate, monthStart),
            lte(transactions.transactionDate, monthEnd)
          )
        );
      
      monthlyEarnings.push({
        month: format(monthStart, 'MMM'),
        amount: Number(monthResult[0]?.total || 0),
      });
    }
    
    // Get commission breakdown by benefit program group
    const breakdownQuery = await db
      .select({
        programType: benefitPrograms.programType, // Use programType instead of programGroup
        amount: sql<string>`SUM(CAST(${commissions.amount} AS DECIMAL))`,
      })
      .from(commissions)
      .innerJoin(
        transactions,
        eq(commissions.transactionId, transactions.id)
      )
      .innerJoin(
        benefitPrograms,
        eq(transactions.benefitProgramId, benefitPrograms.id)
      )
      .where(eq(commissions.brokerId, brokerId))
      .groupBy(benefitPrograms.programType);
    
    // Calculate total for percentages
    const totalAmount = breakdownQuery.reduce((sum, item) => sum + Number(item.amount), 0);
    
    const breakdown = breakdownQuery.map(item => ({
      type: item.programType,
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
    
    // Get top benefit program type
    const topProgramQuery = await db
      .select({
        programType: benefitPrograms.programType,
        amount: sql<string>`SUM(CAST(${commissions.amount} AS DECIMAL))`,
      })
      .from(commissions)
      .innerJoin(
        transactions,
        eq(commissions.transactionId, transactions.id)
      )
      .innerJoin(
        benefitPrograms,
        eq(transactions.benefitProgramId, benefitPrograms.id)
      )
      .where(eq(commissions.brokerId, brokerId))
      .groupBy(benefitPrograms.programType)
      .orderBy(desc(sql`SUM(CAST(${commissions.amount} AS DECIMAL))`))
      .limit(1);
    
    let topPropertyType = {
      name: "Unknown",
      percentage: 0,
    };
    
    if (topProgramQuery.length > 0) {
      const programTypeReadable = topProgramQuery[0].programType
        .replace(/_/g, ' ')
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      topPropertyType = {
        name: programTypeReadable,
        percentage: totalAmount > 0 ? (Number(topProgramQuery[0].amount) / totalAmount) * 100 : 0,
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
        .select({ total: sql<string>`SUM(CAST(${commissions.amount} AS DECIMAL))` })
        .from(commissions)
        .where(
          and(
            eq(commissions.brokerId, brokerId),
            eq(commissions.status, 'approved'),
            gte(commissions.paymentDate, period.start),
            lte(commissions.paymentDate, period.end)
          )
        );
      
      earnings.push({
        period: period.label,
        amount: Number(result[0]?.total || 0),
      });
    }
    
    // Get program type breakdown
    const typeBreakdown = await db
      .select({
        programType: benefitPrograms.programType,
        amount: sql<string>`SUM(CAST(${commissions.amount} AS DECIMAL))`,
      })
      .from(commissions)
      .innerJoin(
        transactions,
        eq(commissions.transactionId, transactions.id)
      )
      .innerJoin(
        benefitPrograms,
        eq(transactions.benefitProgramId, benefitPrograms.id)
      )
      .where(eq(commissions.brokerId, brokerId))
      .groupBy(benefitPrograms.programType);
    
    // Calculate total for percentages
    const totalAmount = typeBreakdown.reduce((sum, item) => sum + Number(item.amount), 0);
    
    const typeBreakdownWithPercentages = typeBreakdown.map(item => ({
      type: item.programType,
      amount: Number(item.amount),
      percentage: totalAmount > 0 ? (Number(item.amount) / totalAmount) * 100 : 0,
    }));
    
    return {
      earnings,
      typeBreakdown: typeBreakdownWithPercentages,
    };
  }
};
