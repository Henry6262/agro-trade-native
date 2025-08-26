import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { 
  SellerOnboardingDto, 
  BuyerOnboardingDto, 
  TransporterOnboardingDto 
} from './dto';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  async completeSellerOnboarding(userId: string, data: SellerOnboardingDto) {
    // Verify user exists and has FARMER role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { farmerProfile: true, companyInfo: true }
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.role !== UserRole.FARMER) {
      throw new BadRequestException('User must have FARMER role for seller onboarding');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Update or create farmer profile
      const farmerProfile = await tx.farmerProfile.upsert({
        where: { userId },
        update: {
          farmName: data.farmName,
          locationAddress: data.locationAddress,
          locationLat: data.locationLat,
          locationLng: data.locationLng,
          businessId: data.businessId,
          iban: data.iban,
          certifications: data.certifications || [],
        },
        create: {
          userId,
          farmName: data.farmName,
          locationAddress: data.locationAddress,
          locationLat: data.locationLat,
          locationLng: data.locationLng,
          businessId: data.businessId,
          iban: data.iban,
          certifications: data.certifications || [],
        },
      });

      // Handle company info if provided
      let companyInfo = null;
      if (data.companyInfo) {
        companyInfo = await tx.companyInfo.upsert({
          where: { userId },
          update: {
            companyName: data.companyInfo.companyName,
            vatNumber: data.companyInfo.vatNumber,
            businessLicense: data.companyInfo.businessLicense,
            companyAddress: data.companyInfo.companyAddress || undefined,
            website: data.companyInfo.website,
            establishedYear: data.companyInfo.establishedYear,
          },
          create: {
            userId,
            companyName: data.companyInfo.companyName,
            vatNumber: data.companyInfo.vatNumber,
            businessLicense: data.companyInfo.businessLicense,
            companyAddress: data.companyInfo.companyAddress || undefined,
            website: data.companyInfo.website,
            establishedYear: data.companyInfo.establishedYear,
          },
        });
      }

      // Create products
      const products = await Promise.all(
        data.selectedProducts.map(productData =>
          tx.product.create({
            data: {
              farmerId: userId,
              name: productData.name || productData.category,
              category: productData.category,
              quantity: productData.quantity || 0,
              unit: productData.unit || 'TON',
              pricePerUnit: productData.pricePerTon || 0,
              location: productData.locationAddress,
            },
          })
        )
      );

      return {
        farmerProfile,
        companyInfo,
        products,
        message: 'Seller onboarding completed successfully'
      };
    });
  }

  async completeBuyerOnboarding(userId: string, data: BuyerOnboardingDto) {
    // Verify user exists and has BUYER role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { buyerProfile: true, companyInfo: true }
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.role !== UserRole.BUYER) {
      throw new BadRequestException('User must have BUYER role for buyer onboarding');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Update or create buyer profile
      const buyerProfile = await tx.buyerProfile.upsert({
        where: { userId },
        update: {
          companyName: data.companyName,
          vatId: data.vatId,
          billingAddress: data.billingAddress || undefined,
          paymentMethod: data.paymentMethod || undefined,
        },
        create: {
          userId,
          companyName: data.companyName,
          vatId: data.vatId,
          billingAddress: data.billingAddress || undefined,
          paymentMethod: data.paymentMethod || undefined,
        },
      });

      // Handle company info if provided
      let companyInfo = null;
      if (data.companyInfo) {
        companyInfo = await tx.companyInfo.upsert({
          where: { userId },
          update: {
            companyName: data.companyInfo.companyName,
            vatNumber: data.companyInfo.vatNumber,
            businessLicense: data.companyInfo.businessLicense,
            companyAddress: data.companyInfo.companyAddress || undefined,
            website: data.companyInfo.website,
            establishedYear: data.companyInfo.establishedYear,
          },
          create: {
            userId,
            companyName: data.companyInfo.companyName,
            vatNumber: data.companyInfo.vatNumber,
            businessLicense: data.companyInfo.businessLicense,
            companyAddress: data.companyInfo.companyAddress || undefined,
            website: data.companyInfo.website,
            establishedYear: data.companyInfo.establishedYear,
          },
        });
      }

      // Note: Requirements are stored for future matching but not in a separate table
      // They could be stored in the buyerProfile as JSON if needed for future features

      return {
        buyerProfile,
        companyInfo,
        requirements: data.requirements,
        message: 'Buyer onboarding completed successfully'
      };
    });
  }

  async completeTransporterOnboarding(userId: string, data: TransporterOnboardingDto) {
    // Verify user exists and has TRANSPORTER role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { transporterProfile: true, companyInfo: true }
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.role !== UserRole.TRANSPORTER) {
      throw new BadRequestException('User must have TRANSPORTER role for transporter onboarding');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Update or create transporter profile
      const transporterProfile = await tx.transporterProfile.upsert({
        where: { userId },
        update: {
          companyName: data.companyName,
          licenseNumber: data.licenseNumber,
          baseLocationAddress: data.baseLocationAddress,
          baseLocationLat: data.baseLocationLat,
          baseLocationLng: data.baseLocationLng,
          insuranceDocUrl: data.insuranceDocUrl,
          iban: data.iban,
        },
        create: {
          userId,
          companyName: data.companyName,
          licenseNumber: data.licenseNumber,
          baseLocationAddress: data.baseLocationAddress,
          baseLocationLat: data.baseLocationLat,
          baseLocationLng: data.baseLocationLng,
          insuranceDocUrl: data.insuranceDocUrl,
          iban: data.iban,
        },
      });

      // Handle company info if provided
      let companyInfo = null;
      if (data.companyInfo) {
        companyInfo = await tx.companyInfo.upsert({
          where: { userId },
          update: {
            companyName: data.companyInfo.companyName,
            vatNumber: data.companyInfo.vatNumber,
            businessLicense: data.companyInfo.businessLicense,
            companyAddress: data.companyInfo.companyAddress || undefined,
            website: data.companyInfo.website,
            establishedYear: data.companyInfo.establishedYear,
          },
          create: {
            userId,
            companyName: data.companyInfo.companyName,
            vatNumber: data.companyInfo.vatNumber,
            businessLicense: data.companyInfo.businessLicense,
            companyAddress: data.companyInfo.companyAddress || undefined,
            website: data.companyInfo.website,
            establishedYear: data.companyInfo.establishedYear,
          },
        });
      }

      // Clear existing bases and create new ones
      await tx.base.deleteMany({
        where: { userId: userId }
      });

      const bases = await Promise.all(
        data.bases.map(baseData =>
          tx.base.create({
            data: {
              userId: userId,
              name: baseData.name,
              address: baseData.address,
              city: 'Unknown', // Default city
              type: 'DEPOT' as const,
              isPrimary: baseData.isPrimary || false,
            },
          })
        )
      );

      // Clear existing fleet vehicles and create new ones
      await tx.fleetVehicle.deleteMany({
        where: { transporterId: userId }
      });

      const fleetVehicles = await Promise.all(
        data.fleetVehicles.map(vehicleData =>
          tx.fleetVehicle.create({
            data: {
              transporterId: userId,
              plateNumber: vehicleData.plateNumber,
              vehicleType: vehicleData.vehicleType,
              capacityKg: vehicleData.capacityKg,
              year: vehicleData.year,
              make: vehicleData.make,
              model: vehicleData.model,
              fuelType: vehicleData.fuelType,
              registrationDoc: vehicleData.registrationDoc,
              insuranceDoc: vehicleData.insuranceDoc,
              licenseDoc: vehicleData.licenseDoc,
              active: vehicleData.active ?? true,
            },
          })
        )
      );

      return {
        transporterProfile,
        companyInfo,
        bases,
        fleetVehicles,
        message: 'Transporter onboarding completed successfully'
      };
    });
  }

  async getOnboardingStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        farmerProfile: true,
        buyerProfile: true,
        transporterProfile: true,
        companyInfo: true,
        products: true,
        bases: true,
        fleetVehicles: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    let isComplete = false;
    let completedSteps: string[] = [];
    let missingSteps: string[] = [];

    switch (user.role) {
      case UserRole.FARMER:
        if (user.farmerProfile) completedSteps.push('profile');
        else missingSteps.push('profile');
        
        if (user.products && user.products.length > 0) completedSteps.push('products');
        else missingSteps.push('products');
        
        isComplete = user.farmerProfile !== null && user.products.length > 0;
        break;

      case UserRole.BUYER:
        if (user.buyerProfile) completedSteps.push('profile');
        else missingSteps.push('profile');
        
        // For buyers, we don't have separate requirements tracking yet
        isComplete = user.buyerProfile !== null;
        break;

      case UserRole.TRANSPORTER:
        if (user.transporterProfile) completedSteps.push('profile');
        else missingSteps.push('profile');
        
        if (user.bases && user.bases.length > 0) completedSteps.push('bases');
        else missingSteps.push('bases');
        
        if (user.fleetVehicles && user.fleetVehicles.length > 0) completedSteps.push('fleet');
        else missingSteps.push('fleet');
        
        isComplete = user.transporterProfile !== null && 
                    user.bases.length > 0 && 
                    user.fleetVehicles.length > 0;
        break;
    }

    if (user.companyInfo) completedSteps.push('company_info');

    return {
      userId: user.id,
      role: user.role,
      isComplete,
      completedSteps,
      missingSteps,
      profile: user.farmerProfile || user.buyerProfile || user.transporterProfile,
      companyInfo: user.companyInfo,
    };
  }
}