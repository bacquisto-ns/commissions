import { queryClient } from "./queryClient";

// Types of resources in the application
export type ResourceType = 
  | 'commission' 
  | 'broker' 
  | 'agency' 
  | 'dashboard' 
  | 'product';

// Cache invalidation strategies
export enum InvalidationScope {
  ITEM,     // Just invalidate the individual item
  LIST,     // Invalidate the collection of items
  RELATED,  // Invalidate related data
  ALL       // Invalidate everything
}

// Relationship map to understand what data is related
const relationshipMap: Record<ResourceType, ResourceType[]> = {
  'commission': ['dashboard', 'broker', 'agency'],
  'broker': ['commission', 'agency', 'dashboard'],
  'agency': ['broker', 'commission', 'dashboard'],
  'dashboard': [],
  'product': ['commission']
};

/**
 * Smart invalidation utility that handles cache refreshing with different granularity levels
 */
export function invalidateQueries(
  resourceType: ResourceType, 
  scope: InvalidationScope = InvalidationScope.ITEM, 
  id?: number | string,
  relatedIds?: Record<string, number | string>
) {
  // Build an array of queries to invalidate
  const queriesToInvalidate: string[] = [];
  
  // Always invalidate the specific resource if an ID is provided
  if (id !== undefined) {
    queriesToInvalidate.push(`/api/${resourceType}s/${id}`);
  }
  
  // Invalidate the list of resources
  if (scope >= InvalidationScope.LIST) {
    queriesToInvalidate.push(`/api/${resourceType}s`);
  }
  
  // Invalidate related data
  if (scope >= InvalidationScope.RELATED) {
    const relatedTypes = relationshipMap[resourceType];
    
    relatedTypes.forEach(relatedType => {
      // If we have a specific ID for the related resource, use it
      const relatedId = relatedIds?.[relatedType];
      
      if (relatedId !== undefined) {
        queriesToInvalidate.push(`/api/${relatedType}s/${relatedId}`);
      } else if (relatedType === 'dashboard' && relatedIds?.brokerId) {
        // Special case for dashboard which needs a broker ID
        queriesToInvalidate.push(`/api/dashboard/${relatedIds.brokerId}`);
      } else if (relatedType === 'agency-dashboard' && relatedIds?.agencyId) {
        // Special case for agency dashboard
        queriesToInvalidate.push(`/api/agency-dashboard/${relatedIds.agencyId}`);
      }
    });
  }
  
  // Invalidate everything if scope is ALL
  if (scope === InvalidationScope.ALL) {
    queryClient.invalidateQueries();
    return;
  }
  
  // Execute the invalidations
  queriesToInvalidate.forEach(queryKey => {
    queryClient.invalidateQueries({ queryKey: [queryKey] });
  });
  
  console.log(`Invalidated queries:`, queriesToInvalidate);
}

/**
 * Utility function to refresh dashboard data specifically
 */
export function refreshDashboardData(brokerId?: number, agencyId?: number) {
  if (brokerId) {
    queryClient.invalidateQueries({ queryKey: [`/api/dashboard/${brokerId}`] });
  }
  
  if (agencyId) {
    queryClient.invalidateQueries({ queryKey: [`/api/agency-dashboard/${agencyId}`] });
  }
}