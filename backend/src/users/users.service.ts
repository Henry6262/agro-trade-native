import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    try {
      return await this.prisma.user.create({
        data,
        include: {
          profile: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    
    return this.prisma.user.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        profile: true,
      },
    });
  }

  async findOne(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        sellOrders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        buyOrders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        include: {
          profile: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      throw error;
    }
  }

  async updateProfile(userId: string, data: any): Promise<any> {
    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });

    // Check if profile is complete and update user
    const isComplete = this.checkProfileCompleteness(profile);
    await this.prisma.user.update({
      where: { id: userId },
      data: { isProfileComplete: isComplete },
    });

    return profile;
  }

  async delete(id: string): Promise<User> {
    try {
      return await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      throw error;
    }
  }

  async getUserStats(userId: string) {
    const user = await this.findOne(userId);
    
    const stats = await this.prisma.$transaction([
      // Count sell orders
      this.prisma.order.count({
        where: {
          sellerId: userId,
          type: 'SELL',
        },
      }),
      // Count buy orders
      this.prisma.order.count({
        where: {
          buyerId: userId,
          type: 'BUY',
        },
      }),
      // Count deals as seller
      this.prisma.deal.count({
        where: {
          sellerId: userId,
        },
      }),
      // Count deals as buyer
      this.prisma.deal.count({
        where: {
          buyerId: userId,
        },
      }),
      // Count transport jobs (for transporters)
      this.prisma.transportJob.count({
        where: {
          assignedTransporterId: userId,
        },
      }),
      // Average rating
      this.prisma.review.aggregate({
        where: {
          revieweeId: userId,
        },
        _avg: {
          overallRating: true,
        },
      }),
    ]);

    return {
      user,
      stats: {
        sellOrders: stats[0],
        buyOrders: stats[1],
        dealsAsSeller: stats[2],
        dealsAsBuyer: stats[3],
        transportJobs: stats[4],
        averageRating: stats[5]._avg.overallRating || 0,
      },
    };
  }

  private checkProfileCompleteness(profile: any): boolean {
    // Define required fields based on user role
    const requiredFields = ['description'];
    
    if (profile.user?.role === UserRole.FARMER) {
      requiredFields.push('farmSize', 'cropsGrown');
    } else if (profile.user?.role === UserRole.FACTORY) {
      requiredFields.push('industryType', 'processingCapacity');
    } else if (profile.user?.role === UserRole.TRANSPORTER) {
      requiredFields.push('vehicleTypes', 'maxCapacity', 'licenseNumber');
    }

    return requiredFields.every(field => profile[field] != null);
  }
}