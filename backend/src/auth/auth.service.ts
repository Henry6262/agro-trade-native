import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole, BaseType, ProductUnit, StockStatus } from '@prisma/client';
import { RegisterWithCompanyDto } from './dto/register-with-company.dto';
import { 
  SellerOnboardingDataDto, 
  BuyerOnboardingDataDto, 
  TransporterOnboardingDataDto 
} from './dto/onboarding-data.dto';

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
        // For existing user sign-in attempts, don't create a new user
        // The Google strategy should handle this case
        console.log(`New Google user detected: ${email}`);
        
        // Create minimal user record for OAuth flow - will need profile completion
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
          
          // Process seller onboarding data
          if (data.onboardingData) {
            const sellerData = data.onboardingData as SellerOnboardingDataDto;
            console.log('Processing seller onboarding data:', sellerData);
            
            // Create bases
            if (sellerData.bases && sellerData.bases.length > 0) {
              for (const baseData of sellerData.bases) {
                const base = await tx.base.create({
                  data: {
                    userId: user.id,
                    name: baseData.name,
                    type: baseData.type as BaseType,
                    address: baseData.address,
                    city: baseData.city,
                    region: baseData.region,
                    country: baseData.country,
                    postalCode: baseData.postalCode,
                    latitude: baseData.latitude,
                    longitude: baseData.longitude,
                    storageCapacity: baseData.storageCapacity,
                    isPrimary: baseData.isPrimary || false,
                    isActive: true,
                  },
                });
                
                // Create stock entries for each product at this base
                for (const spec of sellerData.productSpecifications) {
                  // Find distribution for this product and base
                  const distribution = sellerData.distributions?.find(d => 
                    d.productId === spec.productId
                  )?.distributions?.find(d => 
                    d.baseId === baseData.name // Match by base name temporarily
                  );
                  
                  if (distribution) {
                    await tx.baseStock.create({
                      data: {
                        baseId: base.id,
                        userId: user.id,
                        productId: spec.productId,
                        quantity: distribution.quantity,
                        unit: spec.unit as ProductUnit,
                        status: StockStatus.AVAILABLE,
                        pricePerUnit: spec.pricePerKilo,
                      },
                    });
                  }
                }
              }
            }
            
            // Create product listings for seller's products
            for (const spec of sellerData.productSpecifications) {
              const pricePerUnit = spec.pricePerKilo || 0;
              await tx.productListing.create({
                data: {
                  userId: user.id,
                  productId: spec.productId,
                  listingType: 'SELL',
                  quantity: spec.quantity,
                  unit: spec.unit as ProductUnit,
                  pricePerUnit: pricePerUnit,
                  totalValue: spec.quantity * pricePerUnit,
                  status: 'ACTIVE',
                  description: `Varieties: ${spec.varieties?.join(', ') || 'N/A'}`,
                },
              });
            }
          }
          break;
        
        case UserRole.BUYER:
          profile = await tx.buyerProfile.create({
            data: {
              userId: user.id,
              companyName: data.companyInfo?.companyName || null,
            },
          });
          
          // Process buyer onboarding data
          if (data.onboardingData) {
            const buyerData = data.onboardingData as BuyerOnboardingDataDto;
            console.log('Processing buyer onboarding data:', buyerData);
            
            // Create bases/delivery locations
            if (buyerData.bases && buyerData.bases.length > 0) {
              for (const baseData of buyerData.bases) {
                const base = await tx.base.create({
                  data: {
                    userId: user.id,
                    name: baseData.name,
                    type: baseData.type as BaseType,
                    address: baseData.address,
                    city: baseData.city,
                    region: baseData.region,
                    country: baseData.country,
                    postalCode: baseData.postalCode,
                    latitude: baseData.latitude,
                    longitude: baseData.longitude,
                    storageCapacity: baseData.storageCapacity,
                    isPrimary: baseData.isPrimary || false,
                    isActive: true,
                  },
                });
                
                // Create demand entries for each product at this base
                for (const req of buyerData.productRequirements) {
                  // Find distribution for this product and base
                  const distribution = buyerData.distributions?.find(d => 
                    d.productId === req.productId
                  )?.distributions?.find(d => 
                    d.baseId === baseData.name // Match by base name temporarily
                  );
                  
                  if (distribution) {
                    await tx.baseDemand.create({
                      data: {
                        baseId: base.id,
                        userId: user.id,
                        productId: req.productId,
                        requiredQuantity: distribution.quantity,
                        unit: req.unit as ProductUnit,
                        maxPricePerUnit: req.maxPricePerKilo,
                        urgency: 'within_week',
                        remainingQuantity: distribution.quantity,
                      },
                    });
                  }
                }
              }
            }
            
            // Create buy listings for buyer's requirements
            for (const req of buyerData.productRequirements) {
              const pricePerUnit = req.maxPricePerKilo || 0;
              await tx.productListing.create({
                data: {
                  userId: user.id,
                  productId: req.productId,
                  listingType: 'BUY',
                  quantity: req.quantity,
                  unit: req.unit as ProductUnit,
                  pricePerUnit: pricePerUnit,
                  totalValue: req.quantity * pricePerUnit,
                  status: 'ACTIVE',
                  description: `Delivery: ${req.deliveryFrequency || 'As needed'}`,
                },
              });
            }
          }
          break;
        
        case UserRole.TRANSPORTER:
          profile = await tx.transporterProfile.create({
            data: {
              userId: user.id,
              companyName: data.companyInfo?.companyName || null,
            },
          });
          
          // Process transporter onboarding data
          if (data.onboardingData) {
            const transportData = data.onboardingData as TransporterOnboardingDataDto;
            console.log('Processing transporter onboarding data:', transportData);
            
            // Update transporter profile with additional details
            await tx.transporterProfile.update({
              where: { userId: user.id },
              data: {
                baseLocationAddress: transportData.baseLocation?.address,
                // Store fleet and service area in profile for now
                // In future, create separate Fleet and ServiceArea tables
              },
            });
            
            // Create fleet vehicles
            if (transportData.fleetInfo.vehicleCount > 0) {
              // For now, create generic vehicles based on count
              // In future, allow detailed vehicle registration
              for (let i = 0; i < transportData.fleetInfo.vehicleCount; i++) {
                await tx.fleetVehicle.create({
                  data: {
                    transporterId: user.id,
                    plateNumber: `TEMP-${i + 1}`,
                    vehicleType: 'FLATBED', // Default, will map from vehicleTypes later
                    capacityKg: Math.round((transportData.fleetInfo.totalCapacity / transportData.fleetInfo.vehicleCount) * 1000), // Convert tons to kg
                    active: true,
                  },
                });
              }
            }
          }
          break;
      }

      // Generate JWT tokens for the new user
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
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          hasProfile: true,
        },
        token: accessToken,
        refreshToken,
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