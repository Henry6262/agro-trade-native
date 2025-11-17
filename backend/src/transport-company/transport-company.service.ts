import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  RegisterCompanyDto,
  VerifyCompanyDto,
} from "./dto/register-company.dto";
import {
  LinkTransporterDto,
  UnlinkTransporterDto,
  InviteTransporterDto,
  TransporterSearchDto,
} from "./dto/link-transporter.dto";
import {
  AdminLevel,
  CompanyType,
  UserRole,
  DriverType,
  DriverStatus,
} from "@prisma/client";
import * as bcrypt from "bcrypt";

@Injectable()
export class TransportCompanyService {
  constructor(private prisma: PrismaService) {}

  async registerCompany(dto: RegisterCompanyDto) {
    // Check for existing company
    const existing = await this.prisma.transportCompany.findFirst({
      where: {
        OR: [
          { companyName: dto.companyName },
          { registrationNumber: dto.registrationNumber },
          { mainEmail: dto.mainEmail },
          ...(dto.vatNumber ? [{ vatNumber: dto.vatNumber }] : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictException("Company with these details already exists");
    }

    // Check if admin email is already in use
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.adminEmail },
    });

    if (existingUser) {
      throw new ConflictException("Admin email is already registered");
    }

    // Start transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create admin user account
      const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);
      const adminUser = await tx.user.create({
        data: {
          email: dto.adminEmail,
          password: hashedPassword,
          name: dto.adminName,
          phoneNumber: dto.adminPhone,
          role: UserRole.COMPANY_ADMIN,
          isEmailVerified: false,
          isPhoneVerified: false,
          onboardingCompleted: true, // Company admins don't need onboarding
        },
      });

      // Create transport company
      const company = await tx.transportCompany.create({
        data: {
          companyName: dto.companyName,
          registrationNumber: dto.registrationNumber,
          vatNumber: dto.vatNumber,
          mainEmail: dto.mainEmail,
          mainPhone: dto.mainPhone,
          website: dto.website,
          companyType: CompanyType.EXTERNAL,
          operatingRegions: dto.operatingRegions,
          specializations: dto.specializations || [],
          fleetSize: 0,
          isVerified: false,
        },
      });

      // Create company admin link
      const companyAdmin = await tx.companyAdmin.create({
        data: {
          userId: adminUser.id,
          transportCompanyId: company.id,
          adminLevel: AdminLevel.OWNER,
          canManageDrivers: true,
          canManageFleet: true,
          canSubmitBids: true,
          canManageFinances: true,
          canViewReports: true,
        },
      });

      return {
        company,
        adminUser: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
        },
        companyAdmin,
      };
    });

    return {
      success: true,
      message: "Company registered successfully. Awaiting verification.",
      data: {
        companyId: result.company.id,
        companyName: result.company.companyName,
        adminEmail: result.adminUser.email,
        isVerified: false,
      },
    };
  }

  async verifyCompany(dto: VerifyCompanyDto, verifiedBy: string) {
    const company = await this.prisma.transportCompany.findUnique({
      where: { id: dto.companyId },
      include: {
        admins: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException("Company not found");
    }

    if (company.isVerified) {
      throw new BadRequestException("Company is already verified");
    }

    // Update company verification status
    const updated = await this.prisma.transportCompany.update({
      where: { id: dto.companyId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: verifiedBy,
      },
    });

    // TODO: Send verification email to company admin

    return {
      success: true,
      message: "Company verified successfully",
      data: updated,
    };
  }

  async getCompanyProfile(companyId: string) {
    const company = await this.prisma.transportCompany.findUnique({
      where: { id: companyId },
      include: {
        admins: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                phoneNumber: true,
              },
            },
          },
        },
        drivers: {
          where: { status: { not: "OFFLINE" } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
            isAvailable: true,
          },
        },
        trucks: {
          select: {
            id: true,
            plateNumber: true,
            type: true,
            capacity: true,
            isAvailable: true,
          },
        },
        _count: {
          select: {
            drivers: true,
            trucks: true,
            transportBids: true,
            transportJobs: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException("Company not found");
    }

    return company;
  }

  async getCompanyByAdminId(userId: string) {
    const admin = await this.prisma.companyAdmin.findUnique({
      where: { userId },
      include: {
        transportCompany: true,
      },
    });

    if (!admin) {
      return null;
    }

    return admin.transportCompany;
  }

  async updateCompanyProfile(companyId: string, updates: any) {
    const company = await this.prisma.transportCompany.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException("Company not found");
    }

    const updated = await this.prisma.transportCompany.update({
      where: { id: companyId },
      data: updates,
    });

    return updated;
  }

  async getUnverifiedCompanies() {
    const companies = await this.prisma.transportCompany.findMany({
      where: { isVerified: false },
      include: {
        admins: {
          include: {
            user: {
              select: {
                email: true,
                name: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return companies;
  }

  async getCompanyStats(companyId: string) {
    const [drivers, trucks, activeBids, activeJobs, completedJobs] =
      await Promise.all([
        this.prisma.driver.count({
          where: { transportCompanyId: companyId },
        }),
        this.prisma.truck.count({
          where: { transportCompanyId: companyId },
        }),
        this.prisma.transportBid.count({
          where: {
            transportCompanyId: companyId,
            status: "PENDING",
          },
        }),
        this.prisma.transportJob.count({
          where: {
            transportCompanyId: companyId,
            status: {
              in: [
                "ASSIGNED",
                "STARTED",
                "PICKING_UP",
                "IN_TRANSIT",
                "DELIVERING",
              ],
            },
          },
        }),
        this.prisma.transportJob.count({
          where: {
            transportCompanyId: companyId,
            status: "COMPLETED",
          },
        }),
      ]);

    return {
      drivers,
      trucks,
      activeBids,
      activeJobs,
      completedJobs,
      totalJobs: activeJobs + completedJobs,
    };
  }

  // ==================== TRANSPORTER LINKING METHODS ====================

  async linkTransporter(companyId: string, dto: LinkTransporterDto) {
    // Verify company exists
    const company = await this.prisma.transportCompany.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException("Company not found");
    }

    // Verify transporter exists and has the right role
    const transporter = await this.prisma.user.findUnique({
      where: { id: dto.transporterId },
    });

    if (!transporter) {
      throw new NotFoundException("Transporter not found");
    }

    if (transporter.role !== UserRole.TRANSPORTER) {
      throw new BadRequestException("User is not a transporter");
    }

    // Check if driver profile already exists for this user
    const existingDriver = await this.prisma.driver.findUnique({
      where: { userId: dto.transporterId },
    });

    if (existingDriver) {
      if (
        existingDriver.transportCompanyId &&
        existingDriver.transportCompanyId !== companyId
      ) {
        throw new ConflictException(
          "Transporter is already linked to another company",
        );
      }

      // Update existing driver profile to link to company
      const updated = await this.prisma.driver.update({
        where: { id: existingDriver.id },
        data: {
          transportCompanyId: companyId,
          driverType: DriverType.EXTERNAL,
        },
      });

      return {
        success: true,
        message: "Transporter linked to company successfully",
        data: updated,
      };
    }

    // Create new driver profile for the transporter
    const driver = await this.prisma.driver.create({
      data: {
        userId: dto.transporterId,
        transportCompanyId: companyId,
        driverType: DriverType.EXTERNAL,
        firstName: transporter.name?.split(" ")[0] || "",
        lastName: transporter.name?.split(" ").slice(1).join(" ") || "",
        email: transporter.email,
        phoneNumber: transporter.phoneNumber,
        licenseNumber: `TMP-${transporter.id}`, // Temporary until they provide real license
        licenseClass: [],
        licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        status: DriverStatus.AVAILABLE,
        isAvailable: true,
      },
    });

    return {
      success: true,
      message: "Transporter linked to company successfully",
      data: driver,
    };
  }

  async unlinkTransporter(companyId: string, dto: UnlinkTransporterDto) {
    // Find the driver profile
    const driver = await this.prisma.driver.findFirst({
      where: {
        userId: dto.transporterId,
        transportCompanyId: companyId,
      },
    });

    if (!driver) {
      throw new NotFoundException("Transporter not found in this company");
    }

    // Remove company association but keep driver profile
    const updated = await this.prisma.driver.update({
      where: { id: driver.id },
      data: {
        transportCompanyId: null,
        driverType: DriverType.INTERNAL, // Convert to internal driver
      },
    });

    return {
      success: true,
      message: "Transporter unlinked from company",
      data: updated,
    };
  }

  async getCompanyTransporters(companyId: string) {
    const drivers = await this.prisma.driver.findMany({
      where: { transportCompanyId: companyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phoneNumber: true,
            lastLogin: true,
            trucks: {
              select: {
                id: true,
                plateNumber: true,
                type: true,
                capacity: true,
                isAvailable: true,
              },
            },
          },
        },
        currentJob: {
          select: {
            id: true,
            status: true,
            jobNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return drivers;
  }

  async searchAvailableTransporters(dto: TransporterSearchDto) {
    const whereClause: any = {
      role: UserRole.TRANSPORTER,
    };

    if (dto.searchTerm) {
      whereClause.OR = [
        { email: { contains: dto.searchTerm, mode: "insensitive" } },
        { name: { contains: dto.searchTerm, mode: "insensitive" } },
        { phoneNumber: { contains: dto.searchTerm } },
      ];
    }

    const transporters = await this.prisma.user.findMany({
      where: whereClause,
      include: {
        driverProfile: {
          select: {
            id: true,
            transportCompanyId: true,
            transportCompany: {
              select: {
                id: true,
                companyName: true,
              },
            },
            status: true,
            isAvailable: true,
          },
        },
        trucks: {
          select: {
            id: true,
            plateNumber: true,
            type: true,
          },
        },
      },
      take: 50,
    });

    // Filter out transporters already linked to companies if needed
    const availableTransporters = transporters.filter(
      (t) => !t.driverProfile || !t.driverProfile.transportCompanyId,
    );

    return {
      total: availableTransporters.length,
      transporters: availableTransporters,
    };
  }

  async inviteTransporter(companyId: string, dto: InviteTransporterDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Create invitation record (you might want to create an Invitation model)
    // For now, we'll create a pending driver record
    const driver = await this.prisma.driver.create({
      data: {
        transportCompanyId: companyId,
        driverType: DriverType.EXTERNAL,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        firstName: dto.firstName,
        lastName: dto.lastName,
        licenseNumber: dto.licenseNumber,
        licenseClass: dto.licenseClass || [],
        licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        status: DriverStatus.OFFLINE,
        isAvailable: false,
      },
    });

    // TODO: Send invitation email with registration link

    return {
      success: true,
      message: "Invitation sent to transporter",
      data: driver,
    };
  }

  async getAvailableCompanies() {
    const companies = await this.prisma.transportCompany.findMany({
      where: {
        isVerified: true, // Only show verified companies
      },
      select: {
        id: true,
        companyName: true,
        operatingRegions: true,
        specializations: true,
        fleetSize: true,
        _count: {
          select: {
            drivers: true,
            trucks: true,
          },
        },
      },
      orderBy: {
        companyName: "asc",
      },
    });

    return companies.map((company) => ({
      id: company.id,
      name: company.companyName,
      operatingRegions: company.operatingRegions,
      specializations: company.specializations,
      fleetSize: company.fleetSize,
      driverCount: company._count.drivers,
      truckCount: company._count.trucks,
    }));
  }
}
