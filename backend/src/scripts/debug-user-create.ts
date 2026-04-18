import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function debugCreateUser() {
    console.log("Debug creating user...");
    const timestamp = Date.now();
    try {
        const hashedPassword = await bcrypt.hash("test123", 10);
        const user = await prisma.user.create({
            data: {
              email: `debug-${timestamp}@test.com`,
              name: `Debug User`,
              password: hashedPassword,
              phoneNumber: `+1555${timestamp.toString().slice(-7)}`,
              role: UserRole.FARMER,
              isEmailVerified: true,
              onboardingCompleted: true,
              isActive: true,
            },
          });
        console.log("✅ Success:", user.id);
    } catch (e: any) {
        console.error("❌ Failed:", e.message);
        if (e.code === 'P2002') console.log("Unique constraint failure");
    } finally {
        await prisma.$disconnect();
    }
}

debugCreateUser();
