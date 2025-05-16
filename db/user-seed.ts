import { db } from "./index";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedAdminUser() {
  console.log("🌱 Seeding admin user...");
  
  try {
    // Check if admin user already exists
    const [existingAdmin] = await db.select().from(users).where(eq(users.username, "admin"));
    
    if (existingAdmin) {
      console.log("✅ Admin user already exists, skipping");
      return;
    }
    
    // Create the admin user
    const [adminUser] = await db.insert(users).values({
      username: "admin",
      password: "admin123", // This would be hashed in a real application
      firstName: "System",
      lastName: "Administrator",
      email: "admin@example.com",
      role: "admin",
      status: "active"
    }).returning();
    
    console.log("✅ Admin user created successfully!");
    return adminUser;
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
    throw error;
  }
}

export async function seedUsers() {
  try {
    // Create admin user
    await seedAdminUser();
    
    console.log("✅ User seeding completed successfully");
  } catch (error) {
    console.error("❌ Error during user seeding:", error);
    throw error;
  }
}

// Execute directly if this file is run directly
if (require.main === module) {
  seedUsers()
    .then(() => process.exit(0))
    .catch(error => {
      console.error("Error seeding users:", error);
      process.exit(1);
    });
}