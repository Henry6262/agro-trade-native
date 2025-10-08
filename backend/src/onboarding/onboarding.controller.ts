import { BadRequestException, Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { OnboardingService } from './onboarding.service';
import {
  SellerOnboardingDto,
  BuyerOnboardingDto,
  TransporterOnboardingDto,
} from './dto';
import {
  OnboardingStatusResponseDto,
  OnboardingUserResponseDto,
} from './dto/onboarding-response.dto';

@ApiTags('Onboarding')
@ApiBearerAuth()
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private onboardingService: OnboardingService) {}

  @Post('seller')
  @ApiOperation({ summary: 'Complete seller onboarding' })
  @ApiBody({ type: SellerOnboardingDto })
  @ApiOkResponse({ type: OnboardingUserResponseDto })
  async completeSellerOnboarding(
    @Request() req: any,
    @Body() sellerOnboardingDto: SellerOnboardingDto,
  ) {
    await this.onboardingService.updateFarmerProfile(
      req.user.sub,
      sellerOnboardingDto,
    );

    return this.finishOnboarding(req.user.sub);
  }

  @Post('buyer')
  @ApiOperation({ summary: 'Complete buyer onboarding' })
  @ApiBody({ type: BuyerOnboardingDto })
  @ApiOkResponse({ type: OnboardingUserResponseDto })
  async completeBuyerOnboarding(
    @Request() req: any,
    @Body() buyerOnboardingDto: BuyerOnboardingDto,
  ) {
    await this.onboardingService.updateBuyerProfile(
      req.user.sub,
      buyerOnboardingDto,
    );

    return this.finishOnboarding(req.user.sub);
  }

  @Post('transporter')
  @ApiOperation({ summary: 'Complete transporter onboarding' })
  @ApiBody({ type: TransporterOnboardingDto })
  @ApiOkResponse({ type: OnboardingUserResponseDto })
  async completeTransporterOnboarding(
    @Request() req: any,
    @Body() transporterOnboardingDto: TransporterOnboardingDto,
  ) {
    await this.onboardingService.updateTransporterProfile(
      req.user.sub,
      transporterOnboardingDto,
    );

    return this.finishOnboarding(req.user.sub);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get onboarding status' })
  @ApiOkResponse({ type: OnboardingStatusResponseDto })
  async getOnboardingStatus(@Request() req: any) {
    const status = await this.onboardingService.getOnboardingStatus(req.user.sub);
    return this.serializeStatus(status);
  }

  private async finishOnboarding(userId: string): Promise<OnboardingUserResponseDto> {
    try {
      const user = await this.onboardingService.completeOnboarding(userId);
      return this.serializeUser(user);
    } catch (error: any) {
      throw new BadRequestException(error?.message || 'Onboarding is not complete');
    }
  }

  private serializeStatus(status: any): OnboardingStatusResponseDto {
    if (!status) {
      throw new BadRequestException('Invalid onboarding status payload');
    }

    const company = status.data?.company
      ? {
          id: status.data.company.id,
          legalName: status.data.company.legalName,
          registrationNumber: status.data.company.registrationNumber,
          vatNumber: status.data.company.vatNumber,
          phoneNumber: status.data.company.phoneNumber,
          email: status.data.company.email,
          website: status.data.company.website,
        }
      : null;

    const addresses = Array.isArray(status.data?.addresses)
      ? status.data.addresses.map((address: any) => ({
          id: address.id,
          addressType: address.addressType,
          label: address.label,
          street: address.street,
          cityId: address.cityId,
          postalCode: address.postalCode,
          country: address.country,
          latitude: address.latitude !== null && address.latitude !== undefined ? Number(address.latitude) : null,
          longitude: address.longitude !== null && address.longitude !== undefined ? Number(address.longitude) : null,
          isDefault: address.isDefault,
        }))
      : [];

    const trucks = Array.isArray(status.data?.trucks)
      ? status.data.trucks.map((truck: any) => ({
          id: truck.id,
          plateNumber: truck.plateNumber,
          capacity: truck.capacity !== null && truck.capacity !== undefined ? Number(truck.capacity) : null,
          type: truck.type,
          currentLocation: truck.currentLocation,
          latitude: truck.latitude !== null && truck.latitude !== undefined ? Number(truck.latitude) : null,
          longitude: truck.longitude !== null && truck.longitude !== undefined ? Number(truck.longitude) : null,
          isAvailable: Boolean(truck.isAvailable),
        }))
      : [];

    return plainToInstance(
      OnboardingStatusResponseDto,
      {
        userId: status.userId,
        role: status.role,
        isComplete: status.isComplete,
        onboardingCompleted: status.onboardingCompleted,
        missingFields: status.missingFields || [],
        data: {
          company,
          addresses,
          trucks,
        },
      },
      { excludeExtraneousValues: false },
    );
  }

  private serializeUser(user: any): OnboardingUserResponseDto {
    if (!user) {
      throw new BadRequestException('Invalid onboarding user payload');
    }

    return plainToInstance(
      OnboardingUserResponseDto,
      {
        id: user.id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        onboardingCompleted: Boolean(user.onboardingCompleted),
      },
      { excludeExtraneousValues: false },
    );
  }
}
