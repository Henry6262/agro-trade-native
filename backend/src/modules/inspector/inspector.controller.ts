import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { InspectorService } from "./inspector.service";
import {
  AcceptJobDto,
  LocationUpdateDto,
  VerificationResultDto,
  JobFilterDto,
} from "./dto";

@UseGuards(JwtAuthGuard)
@Controller("inspector")
export class InspectorController {
  constructor(private readonly inspectorService: InspectorService) {}

  @Get("jobs")
  async getJobs(@Query() filters: JobFilterDto) {
    const jobs = await this.inspectorService.getJobs(filters);
    return {
      success: true,
      data: jobs,
    };
  }

  @Get("jobs/:id")
  async getJobById(@Param("id") id: string) {
    const job = await this.inspectorService.getJobById(id);
    return {
      success: true,
      data: job,
    };
  }

  @Post("jobs/:id/accept")
  @HttpCode(HttpStatus.OK)
  async acceptJob(@Param("id") id: string, @Body() acceptDto: AcceptJobDto) {
    const job = await this.inspectorService.acceptJob(id, acceptDto);
    return {
      success: true,
      data: job,
    };
  }

  @Post("jobs/:id/status")
  @HttpCode(HttpStatus.OK)
  async updateJobStatus(
    @Param("id") id: string,
    @Body() updateDto: { inspectorId?: string; status?: string; arrivedAt?: string },
  ) {
    const job = await this.inspectorService.updateJobStatus(id, updateDto);
    return {
      success: true,
      data: job,
    };
  }

  @Post("jobs/:id/complete")
  @HttpCode(HttpStatus.OK)
  async completeJob(
    @Param("id") id: string,
    @Body() resultDto: VerificationResultDto,
  ) {
    const result = await this.inspectorService.completeJob(id, resultDto);
    return {
      success: true,
      data: result,
    };
  }

  @Post("location")
  @HttpCode(HttpStatus.OK)
  async updateLocation(@Body() updateDto: LocationUpdateDto) {
    return this.inspectorService.updateLocation(updateDto);
  }

  @Get("profile")
  async getProfile(@Request() req: any) {
    if (!req.user?.id) {
      throw new UnauthorizedException("Authentication required");
    }
    const userId = req.user.id;
    const profile = await this.inspectorService.getInspectorProfile(userId);
    return {
      success: true,
      data: profile,
    };
  }
}
