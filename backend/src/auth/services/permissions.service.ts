import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UserRole } from "@prisma/client";

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if user can submit transport bids
   * Only Company Admins and Independent Transporters can bid
   */
  async canSubmitTransportBids(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        driverProfile: {
          select: {
            driverType: true,
            transportCompanyId: true,
          },
        },
      },
    });

    if (!user) return false;

    // Company Admins can always bid
    if (user.role === UserRole.COMPANY_ADMIN) {
      return true;
    }

    // Independent transporters (internal drivers) can bid
    if (user.role === UserRole.TRANSPORTER) {
      if (!user.driverProfile) {
        // Transporter without driver profile = legacy independent transporter
        return true;
      }

      // Internal drivers (independent) can bid
      if (user.driverProfile.driverType === "INTERNAL") {
        return true;
      }

      // External drivers (company drivers) cannot bid
      if (user.driverProfile.driverType === "EXTERNAL") {
        return false;
      }
    }

    return false;
  }

  /**
   * Check if user can assign jobs to drivers
   * Only Company Admins can assign jobs
   */
  async canAssignJobs(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return user?.role === UserRole.COMPANY_ADMIN;
  }

  /**
   * Check if user can view company-wide data
   */
  async canViewCompanyData(
    userId: string,
    companyId?: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        companyAdmin: {
          select: {
            transportCompanyId: true,
          },
        },
        driverProfile: {
          select: {
            transportCompanyId: true,
          },
        },
      },
    });

    if (!user) return false;

    // Platform admins can view everything
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Company admins can view their company data
    if (user.role === UserRole.COMPANY_ADMIN && user.companyAdmin) {
      if (!companyId) return true; // Can view their own company
      return user.companyAdmin.transportCompanyId === companyId;
    }

    // Company drivers can view their company data (limited)
    if (
      user.role === UserRole.TRANSPORTER &&
      user.driverProfile?.transportCompanyId
    ) {
      if (!companyId) return true; // Can view their own company
      return user.driverProfile.transportCompanyId === companyId;
    }

    return false;
  }

  /**
   * Check if user can manage company drivers
   */
  async canManageDrivers(userId: string, companyId?: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        companyAdmin: {
          select: {
            transportCompanyId: true,
            canManageDrivers: true,
          },
        },
      },
    });

    if (!user) return false;

    // Platform admins can manage all drivers
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Company admins with driver management permission
    if (
      user.role === UserRole.COMPANY_ADMIN &&
      user.companyAdmin?.canManageDrivers
    ) {
      if (!companyId) return true; // Can manage their own company drivers
      return user.companyAdmin.transportCompanyId === companyId;
    }

    return false;
  }

  /**
   * Get user's transport company context
   */
  async getUserCompanyContext(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        companyAdmin: {
          include: {
            transportCompany: {
              select: {
                id: true,
                companyName: true,
                isVerified: true,
                operatingRegions: true,
                specializations: true,
              },
            },
          },
        },
        driverProfile: {
          include: {
            transportCompany: {
              select: {
                id: true,
                companyName: true,
                isVerified: true,
                operatingRegions: true,
                specializations: true,
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    // Company Admin context
    if (user.role === UserRole.COMPANY_ADMIN && user.companyAdmin) {
      return {
        userType: "COMPANY_ADMIN" as const,
        company: user.companyAdmin.transportCompany,
        permissions: {
          canBid: true,
          canAssignJobs: true,
          canManageDrivers: user.companyAdmin.canManageDrivers,
          canSubmitBids: user.companyAdmin.canSubmitBids,
          canManageFleet: user.companyAdmin.canManageFleet,
          canViewReports: user.companyAdmin.canViewReports,
        },
      };
    }

    // Company Driver context
    if (
      user.role === UserRole.TRANSPORTER &&
      user.driverProfile?.transportCompany
    ) {
      return {
        userType: "COMPANY_DRIVER" as const,
        company: user.driverProfile.transportCompany,
        permissions: {
          canBid: false,
          canAssignJobs: false,
          canManageDrivers: false,
          canSubmitBids: false,
          canManageFleet: false,
          canViewReports: false,
        },
      };
    }

    // Independent Transporter context
    if (user.role === UserRole.TRANSPORTER) {
      return {
        userType: "INDEPENDENT_TRANSPORTER" as const,
        company: null,
        permissions: {
          canBid: true,
          canAssignJobs: false,
          canManageDrivers: false,
          canSubmitBids: true,
          canManageFleet: true,
          canViewReports: true,
        },
      };
    }

    return null;
  }

  /**
   * Get available drivers for job assignment (company admins only)
   */
  async getAvailableDriversForAssignment(userId: string, companyId?: string) {
    const canAssign = await this.canAssignJobs(userId);
    if (!canAssign) {
      throw new Error("User not authorized to assign jobs");
    }

    // Get company ID from user context if not provided
    let targetCompanyId = companyId;
    if (!targetCompanyId) {
      const context = await this.getUserCompanyContext(userId);
      targetCompanyId = context?.company?.id;
    }

    if (!targetCompanyId) {
      throw new Error("No company context found");
    }

    // Get available drivers in the company
    const drivers = await this.prisma.driver.findMany({
      where: {
        transportCompanyId: targetCompanyId,
        status: "AVAILABLE",
        isAvailable: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
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
    });

    return drivers;
  }
}
