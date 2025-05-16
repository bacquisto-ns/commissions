import { Router, Request, Response } from "express";
import { db } from "@db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

const router = Router();

// Configure session middleware for the entire app
export const configureSession = (app: any) => {
  const PgSession = connectPgSimple(session);
  const sessionConfig = {
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      tableName: 'sessions'
    }),
    secret: process.env.SESSION_SECRET || 'broker-commissions-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: false, // Don't require HTTPS in development
      sameSite: 'lax' as const
    }
  };
  
  app.use(session(sessionConfig));
};

// Login endpoint
router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "Username and password are required" 
    });
  }
  
  try {
    // Clean username input
    const cleanUsername = username.trim().toLowerCase();
    
    // Find user with matching username
    const user = await db.query.users.findFirst({
      where: eq(users.username, cleanUsername)
    });
    
    // If no user found or password doesn't match
    if (!user || user.password !== password) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid username or password" 
      });
    }
    
    // If user is not active
    if (user.status !== "active") {
      return res.status(403).json({ 
        success: false, 
        message: "Account is not active" 
      });
    }
    
    // Set session data
    req.session.userId = user.id;
    req.session.userRole = user.role;
    
    // Force session save
    req.session.save((err) => {
      if (err) {
        console.error("Error saving session:", err);
        return res.status(500).json({ 
          success: false, 
          message: "Error saving session" 
        });
      }
      
      // Return user data (excluding password)
      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status
        }
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

// Logout endpoint
router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Error destroying session" 
      });
    }
    
    res.json({ success: true });
  });
});

// Current user endpoint
router.get("/me", async (req: Request, res: Response) => {
  // Check if user is authenticated
  if (!req.session.userId) {
    return res.status(401).json({ 
      success: false, 
      message: "Not authenticated" 
    });
  }
  
  try {
    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.session.userId)
    });
    
    if (!user) {
      // Session exists but user doesn't - clear session
      req.session.destroy(() => {});
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    // Return user data (excluding password)
    return res.json({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

export default router;