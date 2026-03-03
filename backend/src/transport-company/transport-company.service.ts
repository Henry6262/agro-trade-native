import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
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
import { CreateTruckDto, UpdateTruckDto } from "./dto/truck.dto";
import { CreateDriverDto, UpdateDriverDto } from "./dto/driver.dto";
import {
  AdminLevel,
  CompanyType,
  UserRole,
  DriverType,
  DriverStatus,
  TruckType,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

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

  async getFleetForUser(userId: string) {
    let transportCompanyId: string | null = null;

    const adminCompany = await this.getCompanyByAdminId(userId);
    if (adminCompany) {
      transportCompanyId = adminCompany.id;
    } else {
      const driverProfile = await this.prisma.driver.findFirst({
        where: { userId },
        select: { transportCompanyId: true },
      });
      transportCompanyId = driverProfile?.transportCompanyId ?? null;
    }

    const truckWhere = transportCompanyId
      ? { transportCompanyId }
      : { ownerId: userId };

    const [trucks, drivers] = await Promise.all([
      this.prisma.truck.findMany({
        where: truckWhere,
        include: {
          currentDriver: {
            select: {
              firstName: true,
              lastName: true,
              currentJob: {
                select: {
                  jobNumber: true,
                  status: true,
                },
              },
            },
          },
          transportCompany: {
            select: {
              isVerified: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.driver.findMany({
        where: transportCompanyId
          ? { transportCompanyId }
          : { userId },
        include: {
          currentJob: {
            select: {
              jobNumber: true,
              status: true,
            },
          },
          user: {
            select: {
              phoneNumber: true,
            },
          },
        },
      }),
    ]);

    const mappedTrucks = trucks.map((truck) => {
      const driverName = truck.currentDriver
        ? [truck.currentDriver.firstName, truck.currentDriver.lastName]
            .filter(Boolean)
            .join(" ")
        : undefined;

      const assignment = truck.currentDriver?.currentJob?.jobNumber ?? null;

      return {
        id: truck.id,
        licensePlate: truck.plateNumber,
        model: truck.type,
        capacityTons: Number(truck.capacity),
        status: truck.isAvailable ? "available" : "assigned",
        location: truck.currentLocation ?? "Unknown location",
        verified: truck.transportCompany?.isVerified ?? false,
        driver: driverName,
        assignment,
      };
    });

    const mappedDrivers = drivers.map((driver) => {
      const name =
        [driver.firstName, driver.lastName].filter(Boolean).join(" ") ||
        driver.email ||
        driver.id;
      return {
        id: driver.id,
        name,
        license: driver.licenseNumber,
        phone: driver.phoneNumber ?? driver.user?.phoneNumber ?? null,
        status:
          driver.status === DriverStatus.AVAILABLE ? "available" : "assigned",
        experienceYears: Math.max(1, Math.floor(driver.totalJobs / 5)),
        assignment: driver.currentJob?.jobNumber ?? null,
      };
    });

    const summary = {
      totalTrucks: mappedTrucks.length,
      availableTrucks: mappedTrucks.filter(
        (truck) => truck.status === "available",
      ).length,
      inTransitTrucks: mappedTrucks.filter(
        (truck) => truck.status === "assigned",
      ).length,
      verifiedTrucks: mappedTrucks.filter((truck) => truck.verified).length,
      availableDrivers: mappedDrivers.filter(
        (driver) => driver.status === "available",
      ).length,
      assignedDrivers: mappedDrivers.filter(
        (driver) => driver.status === "assigned",
      ).length,
    };

    return {
      summary,
      trucks: mappedTrucks,
      drivers: mappedDrivers,
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

  // ==================== TRUCK CRUD METHODS ====================

  async createTruck(userId: string, dto: CreateTruckDto) {
    // Get user's company
    const company = await this.getCompanyByAdminId(userId);
    if (!company) {
      throw new UnauthorizedException(
        "You must be a company admin to create trucks",
      );
    }

    // Check for duplicate license plate within company
    const existingTruck = await this.prisma.truck.findFirst({
      where: {
        plateNumber: dto.licensePlate,
        transportCompanyId: company.id,
      },
    });

    if (existingTruck) {
      throw new ConflictException(
        "A truck with this license plate already exists in your company",
      );
    }

    // Map vehicle type to enum
    const truckType = this.mapVehicleTypeToEnum(dto.vehicleType);

    // Create truck
    const truck = await this.prisma.truck.create({
      data: {
        ownerId: userId,
        transportCompanyId: company.id,
        plateNumber: dto.licensePlate,
        type: truckType,
        capacity: dto.capacityTons,
        currentLocation: dto.location?.address || null,
        latitude: dto.location?.lat || null,
        longitude: dto.location?.lng || null,
        isAvailable: true,
      },
    });

    return {
      success: true,
      message: "Truck created successfully",
      data: {
        id: truck.id,
        licensePlate: truck.plateNumber,
        model: truck.type,
        capacityTons: Number(truck.capacity),
        location: truck.currentLocation || "Unknown location",
        status: truck.isAvailable ? "available" : "assigned",
      },
    };
  }

  async updateTruck(userId: string, truckId: string, dto: UpdateTruckDto) {
    // Get user's company
    const company = await this.getCompanyByAdminId(userId);
    if (!company) {
      throw new UnauthorizedException(
        "You must be a company admin to update trucks",
      );
    }

    // Verify truck belongs to company
    const truck = await this.prisma.truck.findFirst({
      where: {
        id: truckId,
        transportCompanyId: company.id,
      },
    });

    if (!truck) {
      throw new NotFoundException(
        "Truck not found or does not belong to your company",
      );
    }

    // If updating license plate, check for duplicates
    if (dto.licensePlate && dto.licensePlate !== truck.plateNumber) {
      const existingTruck = await this.prisma.truck.findFirst({
        where: {
          plateNumber: dto.licensePlate,
          transportCompanyId: company.id,
          id: { not: truckId },
        },
      });

      if (existingTruck) {
        throw new ConflictException(
          "A truck with this license plate already exists in your company",
        );
      }
    }

    // Build update data
    const updateData: any = {};

    if (dto.licensePlate) updateData.plateNumber = dto.licensePlate;
    if (dto.model) updateData.type = this.mapVehicleTypeToEnum(dto.model);
    if (dto.capacityTons) updateData.capacity = dto.capacityTons;
    if (dto.location) {
      updateData.currentLocation = dto.location.address || null;
      updateData.latitude = dto.location.lat;
      updateData.longitude = dto.location.lng;
    }
    if (dto.status === "available") {
      updateData.isAvailable = true;
    } else if (dto.status === "assigned" || dto.status === "maintenance") {
      updateData.isAvailable = false;
    }

    // Update truck
    const updated = await this.prisma.truck.update({
      where: { id: truckId },
      data: updateData,
    });

    return {
      success: true,
      message: "Truck updated successfully",
      data: {
        id: updated.id,
        licensePlate: updated.plateNumber,
        model: updated.type,
        capacityTons: Number(updated.capacity),
        location: updated.currentLocation || "Unknown location",
        status: updated.isAvailable ? "available" : "assigned",
      },
    };
  }

  async deleteTruck(userId: string, truckId: string) {
    // Get user's company
    const company = await this.getCompanyByAdminId(userId);
    if (!company) {
      throw new UnauthorizedException(
        "You must be a company admin to delete trucks",
      );
    }

    // Verify truck belongs to company
    const truck = await this.prisma.truck.findFirst({
      where: {
        id: truckId,
        transportCompanyId: company.id,
      },
      include: {
        currentDriver: true,
      },
    });

    if (!truck) {
      throw new NotFoundException(
        "Truck not found or does not belong to your company",
      );
    }

    // If truck has assigned driver, unassign them
    if (truck.currentDriverId) {
      await this.prisma.driver.update({
        where: { id: truck.currentDriverId },
        data: { currentJobId: null },
      });
    }

    // Soft delete by marking as unavailable
    await this.prisma.truck.delete({
      where: { id: truckId },
    });

    return {
      success: true,
      message: "Truck deleted successfully",
    };
  }

  // ==================== DRIVER CRUD METHODS ====================

  async createDriver(userId: string, dto: CreateDriverDto) {
    // Get user's company
    const company = await this.getCompanyByAdminId(userId);
    if (!company) {
      throw new UnauthorizedException(
        "You must be a company admin to create drivers",
      );
    }

    // Check for duplicate license number within company
    const existingDriver = await this.prisma.driver.findFirst({
      where: {
        licenseNumber: dto.licenseNumber,
        transportCompanyId: company.id,
      },
    });

    if (existingDriver) {
      throw new ConflictException(
        "A driver with this license number already exists in your company",
      );
    }

    // Check for duplicate email or phone if provided
    if (dto.email) {
      const emailExists = await this.prisma.driver.findFirst({
        where: {
          email: dto.email,
          transportCompanyId: company.id,
        },
      });
      if (emailExists) {
        throw new ConflictException(
          "A driver with this email already exists in your company",
        );
      }
    }

    if (dto.phone) {
      const phoneExists = await this.prisma.driver.findFirst({
        where: {
          phoneNumber: dto.phone,
          transportCompanyId: company.id,
        },
      });
      if (phoneExists) {
        throw new ConflictException(
          "A driver with this phone number already exists in your company",
        );
      }
    }

    // Create driver
    const driver = await this.prisma.driver.create({
      data: {
        transportCompanyId: company.id,
        driverType: DriverType.EXTERNAL,
        firstName: dto.firstName,
        lastName: dto.lastName,
        licenseNumber: dto.licenseNumber,
        phoneNumber: dto.phone,
        email: dto.email || null,
        licenseClass: dto.licenseClasses || [],
        licenseExpiryDate: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000,
        ), // 1 year default
        status: DriverStatus.AVAILABLE,
        isAvailable: true,
      },
    });

    return {
      success: true,
      message: "Driver created successfully",
      data: {
        id: driver.id,
        name: `${driver.firstName} ${driver.lastName}`,
        license: driver.licenseNumber,
        phone: driver.phoneNumber,
        email: driver.email,
        status: "available",
        experienceYears: dto.experienceYears || 0,
      },
    };
  }

  async updateDriver(userId: string, driverId: string, dto: UpdateDriverDto) {
    // Get user's company
    const company = await this.getCompanyByAdminId(userId);
    if (!company) {
      throw new UnauthorizedException(
        "You must be a company admin to update drivers",
      );
    }

    // Verify driver belongs to company
    const driver = await this.prisma.driver.findFirst({
      where: {
        id: driverId,
        transportCompanyId: company.id,
      },
    });

    if (!driver) {
      throw new NotFoundException(
        "Driver not found or does not belong to your company",
      );
    }

    // Check for duplicate license number if updating
    if (dto.licenseNumber && dto.licenseNumber !== driver.licenseNumber) {
      const existingDriver = await this.prisma.driver.findFirst({
        where: {
          licenseNumber: dto.licenseNumber,
          transportCompanyId: company.id,
          id: { not: driverId },
        },
      });

      if (existingDriver) {
        throw new ConflictException(
          "A driver with this license number already exists in your company",
        );
      }
    }

    // Check for duplicate email if updating
    if (dto.email && dto.email !== driver.email) {
      const emailExists = await this.prisma.driver.findFirst({
        where: {
          email: dto.email,
          transportCompanyId: company.id,
          id: { not: driverId },
        },
      });

      if (emailExists) {
        throw new ConflictException(
          "A driver with this email already exists in your company",
        );
      }
    }

    // Check for duplicate phone if updating
    if (dto.phone && dto.phone !== driver.phoneNumber) {
      const phoneExists = await this.prisma.driver.findFirst({
        where: {
          phoneNumber: dto.phone,
          transportCompanyId: company.id,
          id: { not: driverId },
        },
      });

      if (phoneExists) {
        throw new ConflictException(
          "A driver with this phone number already exists in your company",
        );
      }
    }

    // Build update data
    const updateData: any = {};

    if (dto.firstName) updateData.firstName = dto.firstName;
    if (dto.lastName) updateData.lastName = dto.lastName;
    if (dto.licenseNumber) updateData.licenseNumber = dto.licenseNumber;
    if (dto.phone) updateData.phoneNumber = dto.phone;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.licenseClasses) updateData.licenseClass = dto.licenseClasses;

    // Map status
    if (dto.status) {
      const statusMap: Record<string, DriverStatus> = {
        available: DriverStatus.AVAILABLE,
        assigned: DriverStatus.ASSIGNED,
        offline: DriverStatus.OFFLINE,
        on_break: DriverStatus.ON_BREAK,
      };
      updateData.status = statusMap[dto.status];
      updateData.isAvailable = dto.status === "available";
    }

    // Update driver
    const updated = await this.prisma.driver.update({
      where: { id: driverId },
      data: updateData,
    });

    return {
      success: true,
      message: "Driver updated successfully",
      data: {
        id: updated.id,
        name: `${updated.firstName} ${updated.lastName}`,
        license: updated.licenseNumber,
        phone: updated.phoneNumber,
        email: updated.email,
        status: updated.isAvailable ? "available" : "assigned",
      },
    };
  }

  async deleteDriver(userId: string, driverId: string) {
    // Get user's company
    const company = await this.getCompanyByAdminId(userId);
    if (!company) {
      throw new UnauthorizedException(
        "You must be a company admin to delete drivers",
      );
    }

    // Verify driver belongs to company
    const driver = await this.prisma.driver.findFirst({
      where: {
        id: driverId,
        transportCompanyId: company.id,
      },
      include: {
        assignedTruck: true,
      },
    });

    if (!driver) {
      throw new NotFoundException(
        "Driver not found or does not belong to your company",
      );
    }

    // If driver is assigned to a truck, unassign them
    if (driver.assignedTruck) {
      await this.prisma.truck.update({
        where: { id: driver.assignedTruck.id },
        data: { currentDriverId: null },
      });
    }

    // Delete driver
    await this.prisma.driver.delete({
      where: { id: driverId },
    });

    return {
      success: true,
      message: "Driver deleted successfully",
    };
  }

  // ==================== DRIVER ASSIGNMENT METHODS ====================

  async assignDriverToTruck(
    userId: string,
    truckId: string,
    driverId: string,
  ) {
    // Get user's company
    const company = await this.getCompanyByAdminId(userId);
    if (!company) {
      throw new UnauthorizedException(
        "You must be a company admin to assign drivers",
      );
    }

    // Verify truck belongs to company
    const truck = await this.prisma.truck.findFirst({
      where: {
        id: truckId,
        transportCompanyId: company.id,
      },
    });

    if (!truck) {
      throw new NotFoundException(
        "Truck not found or does not belong to your company",
      );
    }

    // Verify driver belongs to company
    const driver = await this.prisma.driver.findFirst({
      where: {
        id: driverId,
        transportCompanyId: company.id,
      },
      include: {
        assignedTruck: true,
      },
    });

    if (!driver) {
      throw new NotFoundException(
        "Driver not found or does not belong to your company",
      );
    }

    // Check if driver is already assigned to another truck
    if (driver.assignedTruck && driver.assignedTruck.id !== truckId) {
      throw new BadRequestException(
        `Driver is already assigned to truck ${driver.assignedTruck.plateNumber}. Unassign them first.`,
      );
    }

    // Check if driver is already assigned to this truck
    if (driver.assignedTruck && driver.assignedTruck.id === truckId) {
      return {
        success: true,
        message: "Driver is already assigned to this truck",
        data: {
          truckId: truck.id,
          driverId: driver.id,
        },
      };
    }

    // Assign driver to truck
    await this.prisma.truck.update({
      where: { id: truckId },
      data: { currentDriverId: driverId },
    });

    return {
      success: true,
      message: "Driver assigned to truck successfully",
      data: {
        truckId: truck.id,
        driverId: driver.id,
        truckLicensePlate: truck.plateNumber,
        driverName: `${driver.firstName} ${driver.lastName}`,
      },
    };
  }

  async unassignDriverFromTruck(userId: string, truckId: string) {
    // Get user's company
    const company = await this.getCompanyByAdminId(userId);
    if (!company) {
      throw new UnauthorizedException(
        "You must be a company admin to unassign drivers",
      );
    }

    // Verify truck belongs to company
    const truck = await this.prisma.truck.findFirst({
      where: {
        id: truckId,
        transportCompanyId: company.id,
      },
      include: {
        currentDriver: true,
      },
    });

    if (!truck) {
      throw new NotFoundException(
        "Truck not found or does not belong to your company",
      );
    }

    if (!truck.currentDriverId) {
      return {
        success: true,
        message: "No driver is assigned to this truck",
      };
    }

    // Unassign driver
    await this.prisma.truck.update({
      where: { id: truckId },
      data: { currentDriverId: null },
    });

    return {
      success: true,
      message: "Driver unassigned from truck successfully",
      data: {
        truckId: truck.id,
        previousDriverId: truck.currentDriverId,
      },
    };
  }

  // ==================== HELPER METHODS ====================

  private mapVehicleTypeToEnum(vehicleType?: string): TruckType {
    if (!vehicleType) return TruckType.FLATBED;

    const typeMap: Record<string, TruckType> = {
      FLATBED: TruckType.FLATBED,
      REFRIGERATED: TruckType.REFRIGERATED,
      TANKER: TruckType.TANKER,
      CONTAINER: TruckType.CONTAINER,
      CURTAIN_SIDE: TruckType.CURTAIN_SIDE,
      BOX_TRUCK: TruckType.BOX_TRUCK,
      OTHER: TruckType.OTHER,
    };

    return typeMap[vehicleType.toUpperCase()] || TruckType.FLATBED;
  }
}
