import { queryClient } from "./queryClient";

/**
 * Enhanced query invalidation utility that targets specific resources
 * to minimize unnecessary re-renders and network requests
 */
export function invalidateCommissionQueries(
  commissionId?: number,
  brokerId?: number,
  agencyId?: number,
  shouldInvalidateList: boolean = true
) {
  console.log(`Smart invalidation for commission ${commissionId}`);
  
  // Always invalidate the specific commission if ID provided
  if (commissionId) {
    queryClient.invalidateQueries({ 
      queryKey: [`/api/commissions/${commissionId}`] 
    });
  }
  
  // Invalidate commission list only if needed
  if (shouldInvalidateList) {
    queryClient.invalidateQueries({ 
      queryKey: ['/api/commissions'] 
    });
  }
  
  // Invalidate broker dashboard data if broker ID available
  if (brokerId) {
    queryClient.invalidateQueries({ 
      queryKey: [`/api/dashboard/${brokerId}`] 
    });
  }
  
  // Invalidate agency dashboard if agency ID available
  if (agencyId) {
    queryClient.invalidateQueries({ 
      queryKey: [`/api/agency-dashboard/${agencyId}`] 
    });
  }
}

/**
 * Invalidate broker-related queries
 */
export function invalidateBrokerQueries(
  brokerId?: number,
  agencyId?: number,
  shouldInvalidateCommissions: boolean = true
) {
  // Invalidate specific broker data
  if (brokerId) {
    queryClient.invalidateQueries({ 
      queryKey: [`/api/brokers/${brokerId}`] 
    });
    
    // Invalidate broker dashboard
    queryClient.invalidateQueries({ 
      queryKey: [`/api/dashboard/${brokerId}`] 
    });
  }
  
  // Invalidate broker list
  queryClient.invalidateQueries({ 
    queryKey: ['/api/brokers'] 
  });
  
  // Invalidate agency data if provided
  if (agencyId) {
    queryClient.invalidateQueries({ 
      queryKey: [`/api/agencies/${agencyId}`] 
    });
    queryClient.invalidateQueries({ 
      queryKey: [`/api/agency-dashboard/${agencyId}`] 
    });
  }
  
  // Invalidate commission data if needed
  if (shouldInvalidateCommissions) {
    queryClient.invalidateQueries({ 
      queryKey: ['/api/commissions'] 
    });
  }
}

/**
 * Refresh dashboard data for quick updates
 */
export function refreshDashboardData(brokerId?: number, agencyId?: number) {
  if (brokerId) {
    queryClient.invalidateQueries({ 
      queryKey: [`/api/dashboard/${brokerId}`] 
    });
  }
  
  if (agencyId) {
    queryClient.invalidateQueries({ 
      queryKey: [`/api/agency-dashboard/${agencyId}`] 
    });
  }
}