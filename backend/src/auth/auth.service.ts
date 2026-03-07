import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { SmsService } from "../sms/sms.service";
import { User, UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import axios from "axios";

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface GoogleProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
}

export interface PrivyTokenPayload {
  sub: string;
  iss: string;
  iat: number;
  exp: number;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private smsService: SmsService,
  ) {}

  async validateGoogleUser(profile: GoogleProfile): Promise<User> {
    const { email, firstName, lastName } = profile;
    const fullName = `${firstName} ${lastName}`;

    // Check if user exists by email
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email,
          name: fullName,
          role: UserRole.FARMER, // Default role, will be changed during onboarding
          isEmailVerified: true, // Google users are pre-verified
        },
      });
    }

    return user;
  }

  async login(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const hasProfile = await this.checkProfileCompletion(user);

    // Generate both access and refresh tokens
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: "7d", // Refresh token expires in 7 days
    });

    // Store refresh token in database (optional but recommended)
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        // You could store the refresh token hash here if you add a field to the User model
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        hasProfile,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(refreshToken) as JwtPayload;

      // Get the user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Generate new access token
      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(newPayload);

      return {
        access_token: accessToken,
        refresh_token: refreshToken, // Return same refresh token
      };
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && user.password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        return user;
      }
    }

    return null;
  }

  async register(
    email: string,
    password: string,
    name?: string,
    role: UserRole = UserRole.FARMER,
  ) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    });

    return this.login(user);
  }

  private async checkProfileCompletion(user: User): Promise<boolean> {
    // Since we removed profile tables, we now check if the user has completed onboarding
    // based on the onboardingCompleted field in the user table
    return user.onboardingCompleted;
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  /**
   * Verify Privy JWT token and extract user information
   * This method fetches Privy's public keys and verifies the token signature
   */
  async verifyPrivyToken(token: string): Promise<PrivyTokenPayload> {
    try {
      // Decode token to get the kid (key ID)
      const decoded: any = jwt.decode(token, { complete: true });
      if (!decoded || !decoded.header.kid) {
        throw new BadRequestException("Invalid token: missing key ID");
      }

      const kid = decoded.header.kid;
      const privyAppId = this.configService.get<string>("PRIVY_APP_ID");

      // Fetch JWKS from Privy
      const jwksUrl = `https://auth.privy.io/api/v1/apps/${privyAppId}/jwks.json`;
      const jwksResponse = await axios.get(jwksUrl);
      const jwks = jwksResponse.data;

      // Find the signing key that matches the kid
      const signingKey = jwks.keys.find((key: any) => key.kid === kid);
      if (!signingKey) {
        throw new UnauthorizedException(
          "No matching signing key found for token",
        );
      }

      // Convert JWK to PEM format for verification
      const publicKey = this.jwkToPem(signingKey);

      // Verify the token — Privy signs with ES256 (P-256 elliptic curve)
      const verifiedToken = jwt.verify(token, publicKey, {
        issuer: "privy.io",
        audience: privyAppId,
        algorithms: ["ES256"],
      }) as PrivyTokenPayload;

      return verifiedToken;
    } catch (error: any) {
      console.error("Privy token verification failed:", error);
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Invalid or expired Privy token");
    }
  }

  /**
   * Convert JWK to PEM format
   * Simple implementation for RS256 keys
   */
  private jwkToPem(jwk: any): string {
    // For production, use a library like jwk-to-pem
    // For now, we'll construct a basic PEM from the JWK modulus and exponent
    const { n, e } = jwk;

    // This is a simplified version - in production you'd use a proper library
    // or the full conversion algorithm
    if (!n || !e) {
      throw new Error("Invalid JWK: missing modulus or exponent");
    }

    // Use require to load jwk-to-pem if available, otherwise throw error
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const jwkToPem = require("jwk-to-pem");
      return jwkToPem(jwk);
    } catch {
      throw new Error(
        "jwk-to-pem library required for JWT verification. Run: npm install jwk-to-pem",
      );
    }
  }

  async sendPhoneOtp(phone: string): Promise<{ expiresIn: number }> {
    // Rate limit: max 3 OTP sends per phone per 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentCount = await this.prisma.phoneOtp.count({
      where: { phone, createdAt: { gte: tenMinutesAgo } },
    });

    if (recentCount >= 3) {
      throw new BadRequestException(
        'Too many OTP requests. Please wait 10 minutes before trying again.',
      );
    }

    // Generate 6-digit code and hash it
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.phoneOtp.create({
      data: { phone, codeHash, expiresAt },
    });

    await this.smsService.sendOtp(phone, code);

    return { expiresIn: 300 };
  }

  async verifyPhoneOtp(phone: string, code: string) {
    // Find the most recent non-used, non-expired OTP for this phone
    const otp = await this.prisma.phoneOtp.findFirst({
      where: {
        phone,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('No valid OTP found. Please request a new code.');
    }

    if (otp.attempts >= 5) {
      await this.prisma.phoneOtp.update({ where: { id: otp.id }, data: { used: true } });
      throw new BadRequestException('OTP exhausted after too many attempts. Please request a new code.');
    }

    const isValid = await bcrypt.compare(code, otp.codeHash);

    if (!isValid) {
      await this.prisma.phoneOtp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid OTP code.');
    }

    // Mark OTP as used
    await this.prisma.phoneOtp.update({ where: { id: otp.id }, data: { used: true } });

    // Find or create user by phone number
    let user = await this.prisma.user.findUnique({ where: { phoneNumber: phone } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: `phone-${phone.replace(/\D/g, '')}@agrotrade.local`,
          phoneNumber: phone,
          isPhoneVerified: true,
          isActive: true,
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { isPhoneVerified: true },
      });
    }

    return this.login(user);
  }

  /**
   * Validate Privy user and create/update in database
   * Similar to validateGoogleUser but for Privy authentication
   */
  async validatePrivyUser(
    privyUserId: string,
    email?: string,
    name?: string,
    role?: string,
  ): Promise<User> {
    // If email is provided, try to find existing user by email
    let user: User | null = null;

    if (email) {
      user = await this.prisma.user.findUnique({
        where: { email },
      });
    }

    // Map frontend role names to backend UserRole enum
    let mappedRole: UserRole = UserRole.FARMER; // Default role
    if (role) {
      const roleMap: Record<string, UserRole> = {
        seller: UserRole.FARMER,
        farmer: UserRole.FARMER,
        buyer: UserRole.BUYER,
        transporter: UserRole.TRANSPORTER,
        admin: UserRole.ADMIN,
      };
      mappedRole = roleMap[role.toLowerCase()] || UserRole.FARMER;
    }

    if (!user) {
      // Create new user with Privy authentication
      user = await this.prisma.user.create({
        data: {
          email: email || `privy-${privyUserId}@temp.local`, // Fallback email if none provided
          name: name || "Privy User",
          role: mappedRole,
          isEmailVerified: !!email, // If email provided, consider it verified
          isActive: true,
        },
      });
    } else {
      // Update existing user's role if provided and different
      if (role && user.role !== mappedRole) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { role: mappedRole },
        });
      }
    }

    return user;
  }
}
