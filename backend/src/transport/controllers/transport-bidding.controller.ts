import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { TransportBiddingService } from '../services/transport-bidding.service';
import { PermissionsService } from '../../auth/services/permissions.service';
import {
  CreateTransportRequestDto,
  CreateTransportBidDto,
  UpdateTransportJobStatusDto,
  CompletePickupDto,
  CompleteDeliveryDto,
  GetTransportRequestsQueryDto,
  GetTransportBidsQueryDto,
  GetTransportJobsQueryDto,
  TransportRequestResponseDto,
  TransportBidResponseDto,
  TransportJobResponseDto,
} from '../dto/transport-bidding.dto';

@ApiTags('Transport Bidding')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard)  // Temporarily disabled for testing
@Controller('transport')
export class TransportBiddingController {
  constructor(
    private readonly transportBiddingService: TransportBiddingService,
    private readonly permissionsService: PermissionsService,
  ) {}

  // ==================== TRANSPORT REQUESTS ====================

  @Post('requests')
  // @Roles(UserRole.ADMIN)  // Temporarily disabled for testing
  @ApiOperation({ summary: 'Create a transport request for a trade operation' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Transport request created successfully',
    type: TransportRequestResponseDto,
  })
  async createTransportRequest(@Body() dto: CreateTransportRequestDto) {
    return await this.transportBiddingService.createTransportRequest(dto);
  }

  @Post('requests/auto')
  @ApiOperation({ summary: 'Automatically create a transport request for a trade operation' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Transport request created successfully',
  })
  async autoCreateTransportRequest(@Body() body: { tradeOperationId: string }) {
    if (!body?.tradeOperationId) {
      throw new BadRequestException('tradeOperationId is required');
    }
    return await this.transportBiddingService.autoCreateTransportRequestForTrade(
      body.tradeOperationId,
    );
  }

  @Get('requests')
  @Roles(UserRole.ADMIN, UserRole.TRANSPORTER)
  @ApiOperation({ summary: 'Get transport requests' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of transport requests',
    type: [TransportRequestResponseDto],
  })
  async getTransportRequests(
    @Query() query: GetTransportRequestsQueryDto,
    @Request() req: any
  ) {
    // If transporter, add their ID to query
    if (req.user.role === UserRole.TRANSPORTER) {
      query.transporterId = req.user.id;
    }
    return await this.transportBiddingService.getTransportRequests(query);
  }

  @Get('requests/:id')
  @Roles(UserRole.ADMIN, UserRole.TRANSPORTER)
  @ApiOperation({ summary: 'Get transport request by ID' })
  @ApiParam({ name: 'id', description: 'Transport request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transport request details',
    type: TransportRequestResponseDto,
  })
  async getTransportRequestById(@Param('id') id: string) {
    return await this.transportBiddingService.getTransportRequestById(id);
  }

  // ==================== TRANSPORT BIDS ====================

  @Post('bids')
  @ApiOperation({ summary: 'Submit a bid for a transport request' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bid submitted successfully',
    type: TransportBidResponseDto,
  })
  async createTransportBid(
    @Body() dto: CreateTransportBidDto,
    @Request() req: any
  ) {
    // Check if user can submit bids (Company Admins or Independent Transporters only)
    const canBid = await this.permissionsService.canSubmitTransportBids(req.user.id);
    if (!canBid) {
      throw new Error('User not authorized to submit transport bids');
    }

    return await this.transportBiddingService.createTransportBid(
      req.user.id,
      dto
    );
  }

  @Get('bids')
  @Roles(UserRole.ADMIN, UserRole.TRANSPORTER)
  @ApiOperation({ summary: 'Get transport bids' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of transport bids',
    type: [TransportBidResponseDto],
  })
  async getTransportBids(
    @Query() query: GetTransportBidsQueryDto,
    @Request() req: any
  ) {
    // If transporter, only show their bids
    if (req.user.role === UserRole.TRANSPORTER) {
      query.transporterId = req.user.id;
    }
    return await this.transportBiddingService.getTransportBids(query);
  }

  @Post('bids/:id/accept')
  // @Roles(UserRole.ADMIN)  // Temporarily disabled for testing
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a transport bid' })
  @ApiParam({ name: 'id', description: 'Bid ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bid accepted and transport job created',
  })
  async acceptTransportBid(@Param('id') id: string, @Request() req: any) {
    return await this.transportBiddingService.acceptTransportBid(id, req.user.id);
  }

  @Post('bids/:id/reject')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a transport bid' })
  @ApiParam({ name: 'id', description: 'Bid ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bid rejected',
  })
  async rejectTransportBid(
    @Param('id') id: string,
    @Request() req: any,
    @Body('reason') reason?: string
  ) {
    return await this.transportBiddingService.rejectTransportBid(
      id,
      req.user.id,
      reason
    );
  }

  // ==================== TRANSPORT JOBS ====================

  @Get('jobs')
  @Roles(UserRole.ADMIN, UserRole.TRANSPORTER)
  @ApiOperation({ summary: 'Get transport jobs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of transport jobs',
    type: [TransportJobResponseDto],
  })
  async getTransportJobs(
    @Query() query: GetTransportJobsQueryDto,
    @Request() req: any
  ) {
    // If transporter, only show their jobs
    if (req.user.role === UserRole.TRANSPORTER) {
      query.transporterId = req.user.id;
    }
    return await this.transportBiddingService.getTransportJobs(query);
  }

  @Post('jobs/:id/start')
  @Roles(UserRole.TRANSPORTER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start a transport job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transport job started',
  })
  async startTransportJob(@Param('id') id: string, @Request() req: any) {
    return await this.transportBiddingService.startTransportJob(
      id,
      req.user.id
    );
  }

  @Put('jobs/:id/status')
  @Roles(UserRole.TRANSPORTER)
  @ApiOperation({ summary: 'Update transport job status' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job status updated',
  })
  async updateTransportJobStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTransportJobStatusDto,
    @Request() req: any
  ) {
    return await this.transportBiddingService.updateTransportJobStatus(
      id,
      req.user.id,
      dto
    );
  }

  @Post('jobs/:id/pickup')
  @Roles(UserRole.TRANSPORTER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a pickup for a transport job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pickup completed',
  })
  async completePickup(
    @Param('id') id: string,
    @Body() dto: CompletePickupDto,
    @Request() req: any
  ) {
    return await this.transportBiddingService.completePickup(
      id,
      req.user.id,
      dto
    );
  }

  @Post('jobs/:id/delivery')
  @Roles(UserRole.TRANSPORTER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete delivery for a transport job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Delivery completed',
  })
  async completeDelivery(
    @Param('id') id: string,
    @Body() dto: CompleteDeliveryDto,
    @Request() req: any
  ) {
    return await this.transportBiddingService.completeDelivery(
      id,
      req.user.id,
      dto
    );
  }

  // ==================== ADMIN SPECIFIC ====================

  @Get('requests/:requestId/bids')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all bids for a transport request' })
  @ApiParam({ name: 'requestId', description: 'Transport request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of bids for the transport request',
    type: [TransportBidResponseDto],
  })
  async getBidsForRequest(@Param('requestId') requestId: string) {
    return await this.transportBiddingService.getTransportBids({
      transportRequestId: requestId,
    });
  }

  @Get('trade-operations/:tradeOperationId/transport')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get transport info for a trade operation' })
  @ApiParam({ name: 'tradeOperationId', description: 'Trade operation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transport information for the trade operation',
  })
  async getTransportForTradeOperation(
    @Param('tradeOperationId') tradeOperationId: string
  ) {
    return await this.transportBiddingService.getTransportDataForTradeOperation(
      tradeOperationId,
    );
  }
}
