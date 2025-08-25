import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import { RegisterWithCompanyDto } from './dto/register-with-company.dto';

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
    const { id, email, firstName, lastName } = profile;
    const fullName = `${firstName} ${lastName}`;

    // Check if user exists by Google ID
    let user = await this.prisma.user.findUnique({
      where: { googleId: id },
    });

    if (!user) {
      // Check if email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        // Link Google account to existing user
        user = await this.prisma.user.update({
          where: { email },
          data: {
            googleId: id,
            name: existingUser.name || fullName,
          },
        });
      } else {
        // Create new user - role will be selected during onboarding
        user = await this.prisma.user.create({
          data: {
            googleId: id,
            email,
            name: fullName,
            role: UserRole.FARMER, // Default role, will be changed during onboarding
          },
        });
      }
    }

    return user;
  }

  async login(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d'),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        hasProfile: await this.checkProfileCompletion(user),
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = this.jwtService.sign(newPayload);
      
      const newRefreshToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d'),
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async registerWithCompany(data: RegisterWithCompanyDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          name: data.name,
          phone: data.phone,
          role: data.role,
        },
      });

      // Create company info if provided
      let companyInfo = null;
      if (data.companyInfo) {
        companyInfo = await tx.companyInfo.create({
          data: {
            userId: user.id,
            companyName: data.companyInfo.companyName,
            vatNumber: data.companyInfo.vatNumber,
            businessLicense: data.companyInfo.businessLicense,
            companyAddress: data.companyInfo.companyAddress || undefined,
            website: data.companyInfo.website,
            establishedYear: data.companyInfo.establishedYear,
          },
        });
      }

      // Create role-specific profile based on role
      let profile = null;
      switch (data.role) {
        case UserRole.FARMER:
          profile = await tx.farmerProfile.create({
            data: {
              userId: user.id,
              farmName: data.companyInfo?.companyName || null,
            },
          });
          break;
        
        case UserRole.BUYER:
          profile = await tx.buyerProfile.create({
            data: {
              userId: user.id,
              companyName: data.companyInfo?.companyName || null,
            },
          });
          break;
        
        case UserRole.TRANSPORTER:
          profile = await tx.transporterProfile.create({
            data: {
              userId: user.id,
              companyName: data.companyInfo?.companyName || null,
            },
          });
          break;
      }

      return {
        user,
        companyInfo,
        profile,
        message: 'User registered successfully'
      };
    });
  }

  private async checkProfileCompletion(user: User): Promise<boolean> {
    switch (user.role) {
      case UserRole.FARMER:
        const farmerProfile = await this.prisma.farmerProfile.findUnique({
          where: { userId: user.id },
        });
        return !!farmerProfile?.farmName;
      
      case UserRole.BUYER:
        const buyerProfile = await this.prisma.buyerProfile.findUnique({
          where: { userId: user.id },
        });
        return !!buyerProfile?.companyName;
      
      case UserRole.TRANSPORTER:
        const transporterProfile = await this.prisma.transporterProfile.findUnique({
          where: { userId: user.id },
        });
        return !!transporterProfile?.companyName;
      
      case UserRole.ADMIN:
        return true; // Admin doesn't need profile completion
      
      default:
        return false;
    }
  }
}