import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, AddressType, TruckType, DriverType, DriverStatus } from '@prisma/client';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  async getOnboardingStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        addresses: true,
        trucks: true, // For transporters
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check onboarding completion based on role requirements
    let isComplete = false;
    let missingFields = [];

    // Basic requirements for all users
    if (!user.name) missingFields.push('name');
    if (!user.phoneNumber) missingFields.push('phone number');

    switch (user.role) {
      case UserRole.FARMER:
        // Farmers need at least one address (farm location)
        if (user.addresses.length === 0) {
          missingFields.push('farm location');
        }
        break;

      case UserRole.BUYER:
        // Buyers need company info and delivery address
        if (!user.company) {
          missingFields.push('company information');
        }
        if (user.addresses.length === 0) {
          missingFields.push('delivery address');
        }
        break;

      case UserRole.TRANSPORTER:
        // Transporters need company info and at least one truck
        if (!user.company) {
          missingFields.push('company information');
        }
        if (user.trucks.length === 0) {
          missingFields.push('truck information');
        }
        break;
    }

    isComplete = missingFields.length === 0;

    return {
      userId: user.id,
      role: user.role,
      isComplete,
      onboardingCompleted: user.onboardingCompleted,
      missingFields,
      data: {
        company: user.company,
        addresses: user.addresses,
        trucks: user.trucks,
      },
    };
  }

  async updateUserProfile(userId: string, data: {
    name?: string;
    phoneNumber?: string;
  }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        phoneNumber: data.phoneNumber,
      },
    });
  }

  async updateCompanyInfo(userId: string, data: {
    legalName: string;
    registrationNumber?: string;
    vatNumber?: string;
    phoneNumber?: string;
    email?: string;
    website?: string;
  }) {
    const existingCompany = await this.prisma.company.findUnique({
      where: { userId },
    });

    if (existingCompany) {
      return this.prisma.company.update({
        where: { userId },
        data,
      });
    } else {
      return this.prisma.company.create({
        data: {
          userId,
          ...data,
        },
      });
    }
  }

  async addAddress(userId: string, data: {
    addressType: AddressType;
    label?: string;
    street?: string;
    cityId?: string;
    postalCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
  }) {
    return this.prisma.address.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  async addTruck(userId: string, data: {
    plateNumber: string;
    capacity: number;
    type: TruckType;
    currentLocation?: string;
    latitude?: number;
    longitude?: number;
    isAvailable?: boolean;
  }) {
    return this.prisma.truck.create({
      data: {
        ownerId: userId,
        ...data,
      },
    });
  }

  async completeOnboarding(userId: string) {
    const status = await this.getOnboardingStatus(userId);

    if (!status.isComplete) {
      throw new Error(`Profile is not complete. Missing: ${status.missingFields.join(', ')}`);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted: true,
      },
    });
  }

  // Legacy methods for backward compatibility - redirect to new methods
  async updateFarmerProfile(userId: string, data: any) {
    // Extract relevant fields and update user/address
    const updates = [];
    
    if (data.name || data.phoneNumber) {
      updates.push(this.updateUserProfile(userId, {
        name: data.name,
        phoneNumber: data.phoneNumber,
      }));
    }

    if (data.farmLocation || data.address) {
      updates.push(this.addAddress(userId, {
        addressType: AddressType.FARM,
        label: data.farmName || 'Main Farm',
        street: data.address || data.farmLocation,
        cityId: data.cityId,
        latitude: data.latitude,
        longitude: data.longitude,
      }));
    }

    return Promise.all(updates);
  }

  async updateBuyerProfile(userId: string, data: any) {
    const updates = [];
    
    if (data.name || data.phoneNumber) {
      updates.push(this.updateUserProfile(userId, {
        name: data.name,
        phoneNumber: data.phoneNumber,
      }));
    }

    if (data.companyName || data.legalName) {
      updates.push(this.updateCompanyInfo(userId, {
        legalName: data.companyName || data.legalName,
        registrationNumber: data.registrationNumber,
        vatNumber: data.vatNumber,
        phoneNumber: data.companyPhone,
        email: data.companyEmail,
        website: data.website,
      }));
    }

    if (data.deliveryAddress || data.address) {
      updates.push(this.addAddress(userId, {
        addressType: AddressType.DELIVERY,
        label: 'Delivery Address',
        street: data.deliveryAddress || data.address,
        cityId: data.cityId,
        postalCode: data.postalCode,
        latitude: data.latitude,
        longitude: data.longitude,
      }));
    }

    return Promise.all(updates);
  }

  async updateTransporterProfile(userId: string, data: any) {
    const updates = [];
    
    // Get user details
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Handle company assignment
    if (data.transportCompanyId) {
      // Join existing company
      const company = await this.prisma.transportCompany.findUnique({
        where: { id: data.transportCompanyId },
      });

      if (!company) {
        throw new NotFoundException('Transport company not found');
      }

      // Create or update driver profile linked to company
      const existingDriver = await this.prisma.driver.findUnique({
        where: { userId },
      });

      if (existingDriver) {
        updates.push(
          this.prisma.driver.update({
            where: { userId },
            data: {
              transportCompanyId: data.transportCompanyId,
              driverType: DriverType.EXTERNAL,
              licenseNumber: data.licenseNumber || existingDriver.licenseNumber,
            },
          })
        );
      } else {
        updates.push(
          this.prisma.driver.create({
            data: {
              userId,
              transportCompanyId: data.transportCompanyId,
              driverType: DriverType.EXTERNAL,
              firstName: user.name?.split(' ')[0] || '',
              lastName: user.name?.split(' ').slice(1).join(' ') || '',
              email: user.email,
              phoneNumber: user.phoneNumber,
              licenseNumber: data.licenseNumber || `TMP-${userId}`,
              licenseClass: [],
              licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              status: DriverStatus.AVAILABLE,
              isAvailable: true,
            },
          })
        );
      }
    } else if (data.companyInviteCode) {
      // Handle invite code (future implementation)
      // For now, we'll skip this
      throw new BadRequestException('Invite code feature not yet implemented');
    } else if (data.isIndependent || data.companyName) {
      // Register as independent transporter (internal driver)
      const existingDriver = await this.prisma.driver.findUnique({
        where: { userId },
      });

      if (!existingDriver) {
        updates.push(
          this.prisma.driver.create({
            data: {
              userId,
              driverType: DriverType.INTERNAL,
              firstName: user.name?.split(' ')[0] || '',
              lastName: user.name?.split(' ').slice(1).join(' ') || '',
              email: user.email,
              phoneNumber: user.phoneNumber,
              licenseNumber: data.licenseNumber || `IND-${userId}`,
              licenseClass: [],
              licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              status: DriverStatus.AVAILABLE,
              isAvailable: true,
            },
          })
        );
      }

      // Update company info for independent transporters
      if (data.companyName || data.legalName) {
        updates.push(this.updateCompanyInfo(userId, {
          legalName: data.companyName || data.legalName,
          registrationNumber: data.registrationNumber,
          vatNumber: data.vatNumber,
          phoneNumber: data.companyPhone,
          email: data.companyEmail,
          website: data.website,
        }));
      }
    }
    
    // Update basic user profile
    if (data.name || data.phoneNumber) {
      updates.push(this.updateUserProfile(userId, {
        name: data.name,
        phoneNumber: data.phoneNumber,
      }));
    }

    // Handle trucks
    if (data.trucks && Array.isArray(data.trucks)) {
      for (const truck of data.trucks) {
        updates.push(this.addTruck(userId, truck));
      }
    }

    // Handle fleet vehicles (new field from updated DTO)
    if (data.fleetVehicles && Array.isArray(data.fleetVehicles)) {
      for (const vehicle of data.fleetVehicles) {
        updates.push(this.addTruck(userId, {
          plateNumber: vehicle.plateNumber,
          type: vehicle.vehicleType,
          capacity: vehicle.capacityKg,
          isAvailable: vehicle.active !== false,
        }));
      }
    }

    // Handle base locations
    if (data.bases && Array.isArray(data.bases)) {
      for (const base of data.bases) {
        updates.push(this.addAddress(userId, {
          addressType: AddressType.WAREHOUSE,
          label: base.name || 'Base',
          street: base.address,
          latitude: base.latitude,
          longitude: base.longitude,
        }));
      }
    }

    return Promise.all(updates);
  }
}
