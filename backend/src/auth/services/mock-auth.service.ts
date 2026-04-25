import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@prisma/client";

@Injectable()
export class MockAuthService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Generate a mock JWT token for testing
   */
  generateMockToken(role: UserRole = UserRole.ADMIN): string {
    let sub = "test-user-123";
    let email = "test@agrotrade.com";

    if (role === UserRole.BUYER) {
      sub = "test-buyer-456";
      email = "buyer@agrotrade.com";
    } else if (role === UserRole.FARMER) {
      sub = "test-seller-001";
      email = "seller1@agrotrade.com";
    } else if (role === UserRole.TRANSPORTER) {
      sub = "test-transporter-789";
      email = "transporter@agrotrade.com";
    }

    const payload = {
      sub,
      email,
      role,
      name: "Test User",
      iat: Math.floor(Date.now() / 1000),
      // Note: exp field removed - let JwtService handle expiration
    };

    // Specify expiresIn option instead of including exp in payload
    return this.jwtService.sign(payload, { expiresIn: "1h" });
  }

  /**
   * Sign a specific user object
   */
  sign(user: any): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name || "Test User",
      iat: Math.floor(Date.now() / 1000),
    };

    return this.jwtService.sign(payload, { expiresIn: "1h" });
  }

  /**
   * Generate mock tokens for different roles
   */
  getMockTokens() {
    return {
      admin: this.generateMockToken(UserRole.ADMIN),
      buyer: this.generateMockToken(UserRole.BUYER),
      seller: this.generateMockToken(UserRole.FARMER),
      transporter: this.generateMockToken(UserRole.TRANSPORTER),
    };
  }

  /**
   * Mock user for testing
   */
  getMockUser(role: UserRole = UserRole.ADMIN) {
    let id = "test-user-123";
    let email = "test@agrotrade.com";

    if (role === UserRole.BUYER) {
      id = "test-buyer-456";
      email = "buyer@agrotrade.com";
    } else if (role === UserRole.FARMER) {
      id = "test-seller-001";
      email = "seller1@agrotrade.com";
    } else if (role === UserRole.TRANSPORTER) {
      id = "test-transporter-789";
      email = "transporter@agrotrade.com";
    }

    return {
      id,
      email,
      name: "Test User",
      role,
      isActive: true,
      isEmailVerified: true,
      onboardingCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
