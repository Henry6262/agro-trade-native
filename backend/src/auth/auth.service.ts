import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
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
      expiresIn: '7d', // Refresh token expires in 7 days
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
        throw new UnauthorizedException('Invalid refresh token');
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
      throw new UnauthorizedException('Invalid refresh token');
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

  async register(email: string, password: string, name?: string, role: UserRole = UserRole.FARMER) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
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
}