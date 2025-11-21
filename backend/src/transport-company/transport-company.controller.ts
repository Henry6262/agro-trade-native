import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { TransportCompanyService } from "./transport-company.service";
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
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { ApiOkResponse } from "@nestjs/swagger";
import { FleetResponseDto } from "./dto/fleet.dto";

@Controller("transport-company")
export class TransportCompanyController {
  constructor(
    private readonly transportCompanyService: TransportCompanyService,
  ) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async registerCompany(@Body() dto: RegisterCompanyDto) {
    return this.transportCompanyService.registerCompany(dto);
  }

  @Post("verify")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async verifyCompany(@Body() dto: VerifyCompanyDto, @Request() req: any) {
    return this.transportCompanyService.verifyCompany(dto, req.user.userId);
  }

  @Get("unverified")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getUnverifiedCompanies() {
    return this.transportCompanyService.getUnverifiedCompanies();
  }

  @Get("profile/:id")
  @UseGuards(JwtAuthGuard)
  async getCompanyProfile(@Param("id") id: string) {
    return this.transportCompanyService.getCompanyProfile(id);
  }

  @Get("my-company")
  @UseGuards(JwtAuthGuard)
  async getMyCompany(@Request() req: any) {
    const company = await this.transportCompanyService.getCompanyByAdminId(
      req.user.userId,
    );
    if (!company) {
      return {
        success: false,
        message: "You are not associated with any transport company",
      };
    }
    return {
      success: true,
      data: company,
    };
  }

  @Get("me/fleet")
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: FleetResponseDto })
  async getMyFleet(@Request() req: any) {
    return this.transportCompanyService.getFleetForUser(req.user.userId);
  }

  @Put("profile/:id")
  @UseGuards(JwtAuthGuard)
  async updateCompanyProfile(
    @Param("id") id: string,
    @Body() updates: any,
    @Request() req: any,
  ) {
    // TODO: Add authorization check - only company admins can update their company
    const company = await this.transportCompanyService.getCompanyByAdminId(
      req.user.userId,
    );
    if (!company || company.id !== id) {
      return {
        success: false,
        message: "Unauthorized to update this company",
      };
    }

    const updated = await this.transportCompanyService.updateCompanyProfile(
      id,
      updates,
    );
    return {
      success: true,
      data: updated,
    };
  }

  @Get("stats/:id")
  @UseGuards(JwtAuthGuard)
  async getCompanyStats(@Param("id") id: string) {
    return this.transportCompanyService.getCompanyStats(id);
  }

  // ==================== TRANSPORTER MANAGEMENT ENDPOINTS ====================

  @Post(":companyId/transporters/link")
  @UseGuards(JwtAuthGuard)
  async linkTransporter(
    @Param("companyId") companyId: string,
    @Body() dto: LinkTransporterDto,
    @Request() req: any,
  ) {
    // Verify requester is company admin
    const company = await this.transportCompanyService.getCompanyByAdminId(
      req.user.userId,
    );
    if (!company || company.id !== companyId) {
      return {
        success: false,
        message: "Unauthorized to manage this company",
      };
    }

    return this.transportCompanyService.linkTransporter(companyId, dto);
  }

  @Delete(":companyId/transporters/unlink")
  @UseGuards(JwtAuthGuard)
  async unlinkTransporter(
    @Param("companyId") companyId: string,
    @Body() dto: UnlinkTransporterDto,
    @Request() req: any,
  ) {
    // Verify requester is company admin
    const company = await this.transportCompanyService.getCompanyByAdminId(
      req.user.userId,
    );
    if (!company || company.id !== companyId) {
      return {
        success: false,
        message: "Unauthorized to manage this company",
      };
    }

    return this.transportCompanyService.unlinkTransporter(companyId, dto);
  }

  @Get(":companyId/transporters")
  @UseGuards(JwtAuthGuard)
  async getCompanyTransporters(
    @Param("companyId") companyId: string,
    @Request() req: any,
  ) {
    // Verify requester has access to company
    const company = await this.transportCompanyService.getCompanyByAdminId(
      req.user.userId,
    );
    if (!company || company.id !== companyId) {
      // Check if user is admin
      if (req.user.role !== UserRole.ADMIN) {
        return {
          success: false,
          message: "Unauthorized to view this company",
        };
      }
    }

    return this.transportCompanyService.getCompanyTransporters(companyId);
  }

  @Get("transporters/available")
  @UseGuards(JwtAuthGuard)
  async searchAvailableTransporters(@Query() dto: TransporterSearchDto) {
    return this.transportCompanyService.searchAvailableTransporters(dto);
  }

  @Get("companies/available")
  async getAvailableCompanies() {
    // Public endpoint for transporters to see companies they can join
    return this.transportCompanyService.getAvailableCompanies();
  }

  @Post(":companyId/transporters/invite")
  @UseGuards(JwtAuthGuard)
  async inviteTransporter(
    @Param("companyId") companyId: string,
    @Body() dto: InviteTransporterDto,
    @Request() req: any,
  ) {
    // Verify requester is company admin
    const company = await this.transportCompanyService.getCompanyByAdminId(
      req.user.userId,
    );
    if (!company || company.id !== companyId) {
      return {
        success: false,
        message: "Unauthorized to manage this company",
      };
    }

    return this.transportCompanyService.inviteTransporter(companyId, dto);
  }
}
