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
    const payload = {
      sub: "test-user-123",
      email: "test@agrotrade.com",
      role,
      name: "Test User",
      iat: Math.floor(Date.now() / 1000),
      // Note: exp field removed - let JwtService handle expiration
    };

    // Specify expiresIn option instead of including exp in payload
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
    return {
      id: "test-user-123",
      email: "test@agrotrade.com",
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
