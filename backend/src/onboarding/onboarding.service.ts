import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  async getOnboardingStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        farmerProfile: true,
        buyerProfile: true,
        transporterProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let isComplete = false;
    let profile = null;

    switch (user.role) {
      case UserRole.FARMER:
        profile = user.farmerProfile;
        isComplete = !!user.farmerProfile;
        break;
      case UserRole.BUYER:
        profile = user.buyerProfile;
        isComplete = !!user.buyerProfile;
        break;
      case UserRole.TRANSPORTER:
        profile = user.transporterProfile;
        isComplete = !!user.transporterProfile;
        break;
    }

    return {
      userId: user.id,
      role: user.role,
      isComplete,
      profile,
    };
  }

  async updateFarmerProfile(userId: string, data: any) {
    const existingProfile = await this.prisma.farmerProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      return this.prisma.farmerProfile.update({
        where: { userId },
        data,
      });
    } else {
      return this.prisma.farmerProfile.create({
        data: {
          userId,
          ...data,
        },
      });
    }
  }

  async updateBuyerProfile(userId: string, data: any) {
    const existingProfile = await this.prisma.buyerProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      return this.prisma.buyerProfile.update({
        where: { userId },
        data,
      });
    } else {
      return this.prisma.buyerProfile.create({
        data: {
          userId,
          ...data,
        },
      });
    }
  }

  async updateTransporterProfile(userId: string, data: any) {
    const existingProfile = await this.prisma.transporterProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      return this.prisma.transporterProfile.update({
        where: { userId },
        data,
      });
    } else {
      return this.prisma.transporterProfile.create({
        data: {
          userId,
          ...data,
        },
      });
    }
  }

  async completeOnboarding(userId: string) {
    const status = await this.getOnboardingStatus(userId);

    if (!status.isComplete) {
      throw new Error('Profile is not complete');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted: true,
      },
    });
  }
}