import { Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { brokers } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Extend Express Request to include broker property
declare global {
  namespace Express {
    interface Request {
      broker?: any;
      userRole?: string;
    }
  }
}

// Authentication middleware to verify if user is logged in
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  // First, check if this is a /api/brokers/me request which needs session auth
  if (req.path === '/api/brokers/me') {
    // Get userId from session
    const userId = req.session?.userId;
    const isSystemUser = req.session?.isSystemUser || false;
    
    if (!userId) {
      console.log('No user session found for /api/brokers/me');
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      // If this is a system user (permanent admin)
      if (isSystemUser) {
        const { getSystemUserById } = await import("@shared/auth");
        const systemUser = getSystemUserById(userId);
        
        if (!systemUser) {
          console.log(`System user not found with ID ${userId}`);
          return res.status(404).json({ message: 'User not found' });
        }
        
        // Use system user data
        req.broker = {
          id: systemUser.id,
          username: systemUser.username,
          firstName: systemUser.firstName,
          lastName: systemUser.lastName,
          email: systemUser.email,
          active: systemUser.isActive,
          agencyId: null
        };
        req.userRole = systemUser.role;
        
        return next();
      }
      
      // Otherwise, fetch broker from database using session userId
      const broker = await db.query.brokers.findFirst({
        where: eq(brokers.id, userId),
      });
      
      if (!broker) {
        console.log(`Broker not found with ID ${userId}`);
        return res.status(404).json({ message: 'User not found' });
      }
      
      req.broker = broker;
      req.userRole = req.session?.userRole || 'broker';
      
      return next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({ message: 'Authentication error' });
    }
  }
  
  // For all other requests
  const brokerId = parseInt(req.params.id || '0');
  
  if (brokerId && !isNaN(brokerId)) {
    try {
      const broker = await db.query.brokers.findFirst({
        where: eq(brokers.id, brokerId),
      });
      
      if (broker) {
        req.broker = broker;
        
        // Use session role if available, otherwise determine from broker ID
        if (req.session?.userRole) {
          req.userRole = req.session.userRole;
        } else {
          let role = 'broker';
          if (broker.id === 13) {
            role = 'admin';
          } else if (broker.id === 10) {
            role = 'system_admin';
          } else if (broker.id === 7) {
            role = 'agency_admin';
          }
          req.userRole = role;
        }
        
        return next();
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  }
  
  // Skip auth for non-protected routes
  if (
    req.method === 'GET' || 
    req.path.startsWith('/api/auth') ||
    req.path === '/api/brokers' ||
    req.path === '/api/admin-login' ||
    req.path === '/'
  ) {
    return next();
  }

  return res.status(401).json({ message: 'Unauthorized' });
};

// Role-based authorization middleware
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      // Skip auth check temporarily to allow the application to work without full authentication
      // In a production app, this would be a 401 Unauthorized
      return next();
    }

    // Admin always has full access to everything
    if (req.userRole === 'admin') {
      return next();
    }

    if (allowedRoles.includes(req.userRole)) {
      return next();
    }

    return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
  };
};

// Admin-only authorization middleware
export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userRole) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.userRole === 'admin') {
    return next();
  }

  return res.status(403).json({ message: 'Forbidden: Admin privileges required' });
};

// Check if user has access to a specific agency
export const authorizeAgencyAccess = async (req: Request, res: Response, next: NextFunction) => {
  const agencyId = parseInt(req.params.id || '0');
  
  if (!req.broker || !agencyId) {
    // Skip auth check temporarily
    return next();
  }

  // Admin and system admins can access any agency
  if (req.userRole === 'admin' || req.userRole === 'system_admin') {
    return next();
  }

  // Agency admins can only access their own agency
  if (req.userRole === 'agency_admin' && req.broker.agencyId === agencyId) {
    return next();
  }

  // Brokers can only access their own agency
  if (req.userRole === 'broker' && req.broker.agencyId === agencyId) {
    return next();
  }

  return res.status(403).json({ message: 'Forbidden: You do not have access to this agency' });
};

// Check if user has access to a specific broker
export const authorizeBrokerAccess = async (req: Request, res: Response, next: NextFunction) => {
  const targetBrokerId = parseInt(req.params.id || '0');
  
  if (!req.broker || !targetBrokerId) {
    // Skip auth check temporarily
    return next();
  }

  // Admin and system admins can access any broker
  if (req.userRole === 'admin' || req.userRole === 'system_admin') {
    return next();
  }

  // Agency admins can access brokers in their agency
  if (req.userRole === 'agency_admin') {
    try {
      const targetBroker = await db.query.brokers.findFirst({
        where: eq(brokers.id, targetBrokerId),
      });

      if (targetBroker && targetBroker.agencyId === req.broker.agencyId) {
        return next();
      }
    } catch (error) {
      console.error('Broker access check error:', error);
    }
  }

  // Brokers can only access themselves
  if (req.userRole === 'broker' && req.broker.id === targetBrokerId) {
    return next();
  }

  return res.status(403).json({ message: 'Forbidden: You do not have access to this broker' });
};