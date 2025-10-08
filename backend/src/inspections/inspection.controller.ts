import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import {
  AssignInspectorDto,
  CreateBatchInspectionsDto,
  CreateInspectionRequestDto,
  InspectionAssigneeDto,
  InspectionResponseDto,
  InspectionStatsDto,
  InspectorMissionDto,
  SubmitInspectionResultsDto,
  UpdateInspectionStatusDto,
} from './dto/inspection.dto';
import { InspectionService } from './inspection.service';
import { InspectionStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest {
  user?: {
    id: string;
  };
}

@ApiTags('Inspections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inspections')
export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create inspection request' })
  @ApiBody({ type: CreateInspectionRequestDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Inspection request created',
    type: InspectionResponseDto,
  })
  async createInspection(@Body() data: CreateInspectionRequestDto) {
    const inspection = await this.inspectionService.createInspectionRequest({
      ...data,
      requestedDate: data.requestedDate
        ? new Date(data.requestedDate)
        : undefined,
    });

    return this.serializeInspection(inspection);
  }

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create batch inspection requests' })
  @ApiBody({ type: CreateBatchInspectionsDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Batch inspections created',
    type: InspectionResponseDto,
    isArray: true,
  })
  async createBatchInspections(@Body() data: CreateBatchInspectionsDto) {
    const inspections = await this.inspectionService.createBatchInspections(
      data.tradeOperationId,
      data.saleListingIds,
      data.priority,
    );

    return inspections.map((inspection) => this.serializeInspection(inspection));
  }

  @Put(':id/assign')
  @ApiOperation({ summary: 'Assign inspector to inspection' })
  @ApiBody({ type: AssignInspectorDto })
  @ApiOkResponse({
    description: 'Inspector assigned',
    type: InspectionResponseDto,
  })
  async assignInspector(
    @Param('id') inspectionId: string,
    @Body() payload: AssignInspectorDto,
  ) {
    const inspection = await this.inspectionService.assignInspector(
      inspectionId,
      payload.inspectorId,
    );

    return this.serializeInspection(inspection);
  }

  @Get('inspectors')
  @ApiOperation({ summary: 'Get available inspectors' })
  @ApiOkResponse({
    description: 'List of available inspectors',
    type: InspectionAssigneeDto,
    isArray: true,
  })
  async getAvailableInspectors() {
    const inspectors = await this.inspectionService.getAvailableInspectors();

    return inspectors.map((inspector) =>
      plainToInstance(
        InspectionAssigneeDto,
        {
          id: inspector.id,
          name: inspector.name,
          email: inspector.email,
          activeAssignments: inspector._count?.inspectionAssignments ?? 0,
        },
        { excludeExtraneousValues: false },
      ),
    );
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update inspection status' })
  @ApiBody({ type: UpdateInspectionStatusDto })
  @ApiOkResponse({
    description: 'Status updated',
    type: InspectionResponseDto,
  })
  async updateStatus(
    @Param('id') inspectionId: string,
    @Body() payload: UpdateInspectionStatusDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const inspectorId = req?.user?.id;
    const inspection = await this.inspectionService.updateInspectionStatus(
      inspectionId,
      payload.status,
      inspectorId,
    );

    return this.serializeInspection(inspection);
  }

  @Post(':id/results')
  @ApiOperation({ summary: 'Submit inspection results' })
  @ApiBody({ type: SubmitInspectionResultsDto })
  @ApiOkResponse({
    description: 'Results submitted',
    type: InspectionResponseDto,
  })
  async submitResults(
    @Param('id') inspectionId: string,
    @Body() data: SubmitInspectionResultsDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const inspectorId = req?.user?.id || 'default-inspector';
    const inspection = await this.inspectionService.submitInspectionResults(
      inspectionId,
      inspectorId,
      {
        ...data,
        verificationResult: {
          ...data.verificationResult,
          productSpecifications: data.verificationResult.productSpecifications
            ? {
                ...data.verificationResult.productSpecifications,
                harvestDate: data.verificationResult.productSpecifications.harvestDate
                  ? new Date(data.verificationResult.productSpecifications.harvestDate)
                  : undefined,
              }
            : undefined,
        },
      },
    );

    return this.serializeInspection(inspection);
  }

  @Get('trade-operation/:tradeOperationId')
  @ApiOperation({ summary: 'Get inspections for trade operation' })
  @ApiOkResponse({
    description: 'List of inspections',
    type: InspectionResponseDto,
    isArray: true,
  })
  async getByTradeOperation(
    @Param('tradeOperationId') tradeOperationId: string,
  ) {
    const inspections =
      await this.inspectionService.getInspectionsByTradeOperation(
        tradeOperationId,
      );

    return inspections.map((inspection) => this.serializeInspection(inspection));
  }

  @Get('inspector/:inspectorId')
  @ApiOperation({ summary: 'Get inspector missions' })
  @ApiQuery({ name: 'status', enum: InspectionStatus, required: false })
  @ApiOkResponse({
    description: 'Inspector missions',
    type: InspectorMissionDto,
    isArray: true,
  })
  async getInspectorMissions(
    @Param('inspectorId') inspectorId: string,
    @Query('status') status?: InspectionStatus,
  ) {
    const missions = await this.inspectionService.getInspectorMissions(
      inspectorId,
      status,
    );

    return missions.map((inspection) => this.serializeInspection(inspection));
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get inspection statistics' })
  @ApiOkResponse({
    description: 'Inspection statistics',
    type: InspectionStatsDto,
  })
  async getStats() {
    return this.inspectionService.getInspectionStats();
  }

  private serializeInspection(entity: any): InspectionResponseDto {
    if (!entity) {
      throw new BadRequestException('Invalid inspection payload');
    }

    const saleListing = entity.saleListing
      ? {
          id: entity.saleListing.id,
          sellerId: entity.saleListing.sellerId,
          productId: entity.saleListing.productId,
          quantity: entity.saleListing.quantity
            ? Number(entity.saleListing.quantity)
            : null,
          unit: entity.saleListing.unit,
          askingPrice: entity.saleListing.askingPrice
            ? Number(entity.saleListing.askingPrice)
            : null,
          product: entity.saleListing.product
            ? {
                id: entity.saleListing.product.id,
                name: entity.saleListing.product.name,
                category: entity.saleListing.product.category,
              }
            : null,
          seller: entity.saleListing.seller
            ? {
                id: entity.saleListing.seller.id,
                name: entity.saleListing.seller.name,
                email: entity.saleListing.seller.email,
              }
            : null,
        }
      : null;

    const tradeOperation = entity.tradeOperation
      ? {
          id: entity.tradeOperation.id,
          status: entity.tradeOperation.status,
          buyListing: entity.tradeOperation.buyListing
            ? {
                id: entity.tradeOperation.buyListing.id,
                productId: entity.tradeOperation.buyListing.productId,
                quantity: entity.tradeOperation.buyListing.quantity
                  ? Number(entity.tradeOperation.buyListing.quantity)
                  : null,
                unit: entity.tradeOperation.buyListing.unit,
                buyer: entity.tradeOperation.buyListing.buyer
                  ? {
                      id: entity.tradeOperation.buyListing.buyer.id,
                      name: entity.tradeOperation.buyListing.buyer.name,
                      email: entity.tradeOperation.buyListing.buyer.email,
                    }
                  : null,
              }
            : null,
        }
      : null;

    const inspector = entity.inspector
      ? {
          id: entity.inspector.id,
          name: entity.inspector.name,
          email: entity.inspector.email,
        }
      : null;

    return plainToInstance(
      InspectionResponseDto,
      {
        id: entity.id,
        status: entity.status,
        priority: entity.priority,
        requestedDate: entity.requestedDate?.toISOString(),
        scheduledDate: entity.scheduledDate?.toISOString?.() ?? null,
        completedDate: entity.completedDate?.toISOString?.() ?? null,
        qualityScore: entity.qualityScore,
        verificationResult: entity.verificationResult,
        notes: entity.notes,
        photos: entity.photos,
        latitude: Number(entity.latitude),
        longitude: Number(entity.longitude),
        address: entity.address,
        saleListing,
        inspector,
        tradeOperation,
        createdAt: entity.createdAt?.toISOString?.() ?? new Date().toISOString(),
        updatedAt: entity.updatedAt?.toISOString?.() ?? new Date().toISOString(),
      },
      { excludeExtraneousValues: false },
    );
  }
}
