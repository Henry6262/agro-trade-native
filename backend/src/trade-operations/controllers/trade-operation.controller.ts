import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole, TradePhase, TradeStatus } from '@prisma/client';
import { TradeOperationService } from '../services/trade-operation.service';
import { ProfitCalculationService } from '../services/profit-calculation.service';
import {
  CreateTradeOperationDto,
  AddSellersDto,
} from '../dto/create-trade-operation.dto';
import {
  UpdateTradeOperationDto,
  FinalizeTradeDto,
} from '../dto/update-trade-operation.dto';
import {
  TradeOperationResponseDto,
  TradeOperationListResponseDto,
  TradeAnalyticsDto,
} from '../dto/trade-operation-response.dto';

@ApiTags('Trade Operations')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
@Controller('trade-operations')
export class TradeOperationController {
  constructor(
    private readonly tradeOperationService: TradeOperationService,
    private readonly profitCalculationService: ProfitCalculationService,
  ) {}

  @Post()
  // @Roles(UserRole.ADMIN) // Temporarily disabled for testing
  @ApiOperation({ summary: 'Create a new trade operation' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Trade operation created successfully',
    type: TradeOperationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Body() createDto: CreateTradeOperationDto,
    @Request() req: any,
  ): Promise<TradeOperationResponseDto> {
    // Temporarily use a default admin ID for testing
    const adminId = req.user?.id || 'cmfjihj4d0000shesv3bkdd5r'; // Use first admin from DB
    const tradeOperation = await this.tradeOperationService.createTradeOperation(
      createDto,
      adminId,
    );

    const summary = await this.tradeOperationService.getTradeOperationSummary(
      tradeOperation.id,
    );

    return this.mapToResponseDto(summary);
  }

  @Get()
  // @Roles(UserRole.ADMIN) // Temporarily disabled for testing
  @ApiOperation({ summary: 'Get all trade operations with filters' })
  @ApiQuery({ name: 'phase', enum: TradePhase, required: false })
  @ApiQuery({ name: 'status', enum: TradeStatus, required: false })
  @ApiQuery({ name: 'minProfitMargin', type: Number, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of trade operations',
    type: TradeOperationListResponseDto,
  })
  async findAll(
    @Query('phase') phase?: TradePhase,
    @Query('status') status?: TradeStatus,
    @Query('minProfitMargin') minProfitMargin?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Request() req?: any,
  ): Promise<TradeOperationListResponseDto> {
    const filters = {
      phase,
      status,
      minProfitMargin: minProfitMargin ? parseFloat(minProfitMargin) : undefined,
      // Temporarily disable admin filtering when auth is disabled
      adminId: req?.user?.role === UserRole.ADMIN ? undefined : req?.user?.id,
    };

    const trades = await this.tradeOperationService.getActiveTrades(filters);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const start = (pageNum - 1) * limitNum;
    const paginatedTrades = trades.slice(start, start + limitNum);

    const responseDtos = await Promise.all(
      paginatedTrades.map(async (trade) => {
        const summary = await this.tradeOperationService.getTradeOperationSummary(
          trade.id,
        );
        return this.mapToResponseDto(summary);
      }),
    );

    return {
      data: responseDtos,
      total: trades.length,
      page: pageNum,
      limit: limitNum,
    };
  }

  @Get('analytics')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get trade analytics and profit metrics' })
  @ApiQuery({ name: 'startDate', type: String, required: false })
  @ApiQuery({ name: 'endDate', type: String, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trade analytics data',
    type: TradeAnalyticsDto,
  })
  async getAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<TradeAnalyticsDto> {
    const dateRange = startDate && endDate
      ? {
          start: new Date(startDate),
          end: new Date(endDate),
        }
      : undefined;

    const analytics = await this.tradeOperationService.getProfitAnalytics(dateRange);

    return {
      ...analytics,
      periodStart: dateRange?.start,
      periodEnd: dateRange?.end,
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a specific trade operation' })
  @ApiParam({ name: 'id', description: 'Trade operation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trade operation details',
    type: TradeOperationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Trade operation not found',
  })
  async findOne(@Param('id') id: string): Promise<TradeOperationResponseDto> {
    const summary = await this.tradeOperationService.getTradeOperationSummary(id);
    return this.mapToResponseDto(summary);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a trade operation' })
  @ApiParam({ name: 'id', description: 'Trade operation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trade operation updated successfully',
    type: TradeOperationResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTradeOperationDto,
  ): Promise<TradeOperationResponseDto> {
    // This would need to be implemented in the service
    throw new BadRequestException('Update method not yet implemented');
  }

  @Post(':id/sellers')
  // @Roles(UserRole.ADMIN) // Temporarily disabled for testing
  @ApiOperation({ summary: 'Add sellers to a trade operation' })
  @ApiParam({ name: 'id', description: 'Trade operation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sellers added successfully',
  })
  async addSellers(
    @Param('id') id: string,
    @Body() addSellersDto: AddSellersDto,
  ): Promise<{ message: string; sellersAdded: any[] }> {
    const sellers = await this.tradeOperationService.addSellersToTrade(
      id,
      addSellersDto.sellers,
    );

    return {
      message: 'Sellers added successfully',
      sellersAdded: sellers, // Return the actual TradeSeller records
    };
  }

  @Get(':id/matching-sellers')
  // @Roles(UserRole.ADMIN) // Temporarily disabled for testing
  @ApiOperation({ summary: 'Find matching sellers for a trade operation' })
  @ApiParam({ name: 'id', description: 'Trade operation ID' })
  @ApiQuery({ name: 'quality', enum: ['PREMIUM', 'STANDARD', 'ECONOMY', 'ANY'], required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of matching sellers',
  })
  async findMatchingSellers(
    @Param('id') id: string,
    @Query('quality') quality?: string,
  ): Promise<any> {
    const matches = await this.tradeOperationService.findMatchingSellers(id, {
      qualityPreference: quality as any,
    });

    // Map matches to include full saleListing data for frontend
    const enrichedMatches = matches.map(match => ({
      ...match,
      saleListing: {
        id: match.saleListingId,
        seller: {
          id: match.sellerId,
          name: match.sellerName,
        },
        product: {
          // This would need to be added to the service if needed
          name: 'Product',
        },
        unit: 'TON',
        address: {
          latitude: match.location.lat,
          longitude: match.location.lng,
        },
      },
    }));

    // Calculate summary data
    const totalQuantityAvailable = matches.reduce((sum, s) => sum + s.availableQuantity, 0);
    const averagePrice = matches.length > 0 
      ? matches.reduce((sum, s) => sum + s.askingPrice, 0) / matches.length
      : 0;
    
    // Recommend top 3 sellers by score
    const recommendedSellers = matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.sellerId);

    return {
      sellers: enrichedMatches,
      totalQuantityAvailable,
      averagePrice: Math.round(averagePrice * 100) / 100,
      recommendedSellers,
    };
  }

  @Post(':id/optimize-transport')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Optimize transport route for a trade operation' })
  @ApiParam({ name: 'id', description: 'Trade operation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transport route optimized',
  })
  async optimizeTransport(@Param('id') id: string): Promise<any> {
    const result = await this.tradeOperationService.optimizeTransport(id);

    return {
      message: 'Transport route optimized successfully',
      ...result,
    };
  }

  @Post(':id/finalize')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finalize a trade operation' })
  @ApiParam({ name: 'id', description: 'Trade operation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trade operation finalized',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot finalize trade operation',
  })
  async finalize(
    @Param('id') id: string,
    @Body() finalizeDto?: FinalizeTradeDto,
  ): Promise<any> {
    const result = await this.tradeOperationService.finalizeTrade(id);

    if (!result.success) {
      throw new BadRequestException(result.message);
    }

    return result;
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a trade operation' })
  @ApiParam({ name: 'id', description: 'Trade operation ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Trade operation cancelled',
  })
  async cancel(@Param('id') id: string): Promise<void> {
    // This would need to be implemented in the service
    throw new BadRequestException('Cancel method not yet implemented');
  }

  /**
   * Map internal summary to response DTO
   */
  private mapToResponseDto(summary: any): TradeOperationResponseDto {
    return {
      id: summary.id,
      phase: summary.phase,
      status: summary.status,
      buyer: summary.buyer,
      sellers: summary.sellers,
      profit: summary.profit,
      transport: summary.transport,
      createdAt: summary.timeline.created,
      updatedAt: summary.timeline.lastUpdated,
      expectedDeliveryDate: summary.timeline.expectedCompletion,
      confirmedAt: summary.confirmedAt,
      completedAt: summary.completedAt,
    };
  }
}