import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OnboardingService } from './onboarding.service';
import { 
  SellerOnboardingDto, 
  BuyerOnboardingDto, 
  TransporterOnboardingDto 
} from './dto';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private onboardingService: OnboardingService) {}

  @Post('seller')
  async completeSellerOnboarding(
    @Request() req: any,
    @Body() sellerOnboardingDto: SellerOnboardingDto
  ) {
    // Store the onboarding data first
    await this.onboardingService.updateFarmerProfile(
      req.user.sub,
      sellerOnboardingDto
    );
    // Then mark onboarding as complete
    return this.onboardingService.completeOnboarding(
      req.user.sub
    );
  }

  @Post('buyer')
  async completeBuyerOnboarding(
    @Request() req: any,
    @Body() buyerOnboardingDto: BuyerOnboardingDto
  ) {
    // Store the onboarding data first
    await this.onboardingService.updateBuyerProfile(
      req.user.sub,
      buyerOnboardingDto
    );
    // Then mark onboarding as complete
    return this.onboardingService.completeOnboarding(
      req.user.sub
    );
  }

  @Post('transporter')
  async completeTransporterOnboarding(
    @Request() req: any,
    @Body() transporterOnboardingDto: TransporterOnboardingDto
  ) {
    // Store the onboarding data first
    await this.onboardingService.updateTransporterProfile(
      req.user.sub,
      transporterOnboardingDto
    );
    // Then mark onboarding as complete
    return this.onboardingService.completeOnboarding(
      req.user.sub
    );
  }

  @Get('status')
  async getOnboardingStatus(@Request() req: any) {
    return this.onboardingService.getOnboardingStatus(req.user.sub);
  }
}