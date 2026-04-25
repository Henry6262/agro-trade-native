import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { User } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { InvestmentsService } from "./investments.service";
import { SwapRequestDto } from "./dto/swap-request.dto";
import { UpdateInvestmentPreferenceDto } from "./dto/update-preference.dto";
import { GetQuoteDto } from "./dto/get-quote.dto";

@Controller("investments")
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Get("assets")
  getAssets() {
    return this.investmentsService.getAssets();
  }

  @Get("quote")
  getQuote(@Query() query: GetQuoteDto) {
    return this.investmentsService.getQuote(
      query.inputMint,
      query.outputMint,
      query.amount,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post("swap")
  executeSwap(@CurrentUser() user: User, @Body() dto: SwapRequestDto) {
    return this.investmentsService.executeSwap(
      user.id,
      dto.tradeOperationId,
      dto.assetSymbol,
      dto.amountUsdc,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get("portfolio/:userId")
  async getPortfolio(@CurrentUser() user: User, @Param("userId") userId: string) {
    await this.investmentsService.assertPortfolioAccess(user.id, userId, user.role);
    return this.investmentsService.getPortfolio(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("preferences")
  getPreference(@CurrentUser("id") userId: string) {
    return this.investmentsService.getOrCreatePreference(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("preferences")
  updatePreference(
    @CurrentUser("id") userId: string,
    @Body() dto: UpdateInvestmentPreferenceDto,
  ) {
    return this.investmentsService.updatePreference(userId, dto);
  }
}
