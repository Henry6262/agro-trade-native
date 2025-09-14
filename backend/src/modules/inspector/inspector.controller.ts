import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InspectorService } from './inspector.service';
import { AcceptJobDto, LocationUpdateDto, VerificationResultDto, JobFilterDto } from './dto';

@Controller('api/inspector')
export class InspectorController {
  constructor(private readonly inspectorService: InspectorService) {}

  @Get('jobs')
  async getJobs(@Query() filters: JobFilterDto) {
    try {
      const jobs = await this.inspectorService.getJobs(filters);
      return {
        success: true,
        data: jobs,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('jobs/:id')
  async getJobById(@Param('id') id: string) {
    try {
      const job = await this.inspectorService.getJobById(id);
      return {
        success: true,
        data: job,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('jobs/:id/accept')
  @HttpCode(HttpStatus.OK)
  async acceptJob(@Param('id') id: string, @Body() acceptDto: AcceptJobDto) {
    try {
      const job = await this.inspectorService.acceptJob(id, acceptDto);
      return {
        success: true,
        data: job,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('jobs/:id/complete')
  @HttpCode(HttpStatus.OK)
  async completeJob(@Param('id') id: string, @Body() resultDto: VerificationResultDto) {
    try {
      const result = await this.inspectorService.completeJob(id, resultDto);
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('location')
  @HttpCode(HttpStatus.OK)
  async updateLocation(@Body() updateDto: LocationUpdateDto) {
    try {
      const result = await this.inspectorService.updateLocation(updateDto);
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('profile')
  async getProfile(@Request() req?: any) {
    try {
      // In real implementation, would get user ID from auth token
      const userId = req?.user?.id || 'user-123';
      const profile = await this.inspectorService.getInspectorProfile(userId);
      return {
        success: true,
        data: profile,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}