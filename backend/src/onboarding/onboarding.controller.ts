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
    return this.onboardingService.completeSellerOnboarding(
      req.user.sub,
      sellerOnboardingDto
    );
  }

  @Post('buyer')
  async completeBuyerOnboarding(
    @Request() req: any,
    @Body() buyerOnboardingDto: BuyerOnboardingDto
  ) {
    return this.onboardingService.completeBuyerOnboarding(
      req.user.sub,
      buyerOnboardingDto
    );
  }

  @Post('transporter')
  async completeTransporterOnboarding(
    @Request() req: any,
    @Body() transporterOnboardingDto: TransporterOnboardingDto
  ) {
    return this.onboardingService.completeTransporterOnboarding(
      req.user.sub,
      transporterOnboardingDto
    );
  }

  @Get('status')
  async getOnboardingStatus(@Request() req: any) {
    return this.onboardingService.getOnboardingStatus(req.user.sub);
  }
}