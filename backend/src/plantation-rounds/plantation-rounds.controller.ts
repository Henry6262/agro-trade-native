import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { User, PlantationRoundStatus } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlantationRoundsService } from './plantation-rounds.service';
import { PlantationNftsService } from './plantation-nfts.service';
import { GroveStakingService } from './grove-staking.service';
import { CreateRoundDto } from './dto/create-round.dto';
import { InvestDto } from './dto/invest.dto';
import { DistributeHarvestDto } from './dto/distribute-harvest.dto';

@Controller('plantation-rounds')
export class PlantationRoundsController {
  constructor(
    private readonly roundsService: PlantationRoundsService,
    private readonly nftsService: PlantationNftsService,
    private readonly stakingService: GroveStakingService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createRound(@CurrentUser() user: User, @Body() dto: CreateRoundDto) {
    return this.roundsService.createRound(user.id, dto);
  }

  @Get()
  listRounds(
    @Query('cropType') cropType?: string,
    @Query('status') status?: PlantationRoundStatus,
  ) {
    return this.roundsService.listRounds({ cropType, status });
  }

  @Get('portfolio')
  @UseGuards(JwtAuthGuard)
  getPortfolio(@CurrentUser() user: User) {
    return this.nftsService.getPortfolio(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('yield/:tokenId')
  getPendingYield(
    @Param('tokenId', ParseIntPipe) tokenId: number,
    @CurrentUser() user: User,
  ) {
    return this.stakingService.getPendingYield(tokenId, user.id);
  }

  @Get(':id')
  getRound(@Param('id') id: string) {
    return this.roundsService.getRound(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/invest')
  investInRound(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: InvestDto,
  ) {
    return this.roundsService.investInRound(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/distribute')
  distributeHarvest(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: DistributeHarvestDto,
  ) {
    return this.roundsService.distributeHarvest(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('stake/:tokenId')
  stakeNft(
    @Param('tokenId', ParseIntPipe) tokenId: number,
    @CurrentUser() user: User,
  ) {
    return this.stakingService.stakeNft(tokenId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('unstake/:tokenId')
  unstakeNft(
    @Param('tokenId', ParseIntPipe) tokenId: number,
    @CurrentUser() user: User,
  ) {
    return this.stakingService.unstakeNft(tokenId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('claim/:tokenId')
  claimYield(
    @Param('tokenId', ParseIntPipe) tokenId: number,
    @CurrentUser() user: User,
  ) {
    return this.stakingService.claimYield(tokenId, user.id);
  }
}
