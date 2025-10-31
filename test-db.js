const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("Testing database connection...");
    const userCount = await prisma.user.count();
    console.log(`✓ Database connected\! Found ${userCount} users.`);
    
    const categoryCount = await prisma.category.count();
    console.log(`✓ Found ${categoryCount} categories.`);
    
    const srefCount = await prisma.srefCode.count();
    console.log(`✓ Found ${srefCount} SREF codes.`);
    
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
