import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { BuyerService } from './buyer.service';
import { CreateBuyListingDto } from './dto/create-buy-listing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthRequest {
  user: any; // Full user object from JWT strategy
}

@Controller('buyer')
@UseGuards(JwtAuthGuard)
export class BuyerController {
  constructor(private readonly buyerService: BuyerService) {}

  @Post('listings')
  async createBuyListing(
    @Body() createBuyListingDto: CreateBuyListingDto,
    @Request() req: AuthRequest,
  ) {
    console.log('=== Buyer Listing Creation Request ===');
    console.log('User:', req.user?.id, req.user?.email, req.user?.role);
    console.log('DTO:', JSON.stringify(createBuyListingDto, null, 2));
    
    return this.buyerService.createBuyListing(createBuyListingDto, req.user.id);
  }

  @Get('listings')
  async getMyBuyListings(@Request() req: AuthRequest) {
    return this.buyerService.getBuyerListings(req.user.id);
  }

  @Get('listings/:id')
  async getBuyListingById(
    @Param('id') id: string,
    @Request() req: AuthRequest,
  ) {
    return this.buyerService.getBuyListingById(id, req.user.id);
  }

  // Get received offers from sellers
  @Get('offers')
  async getMyOffers(@Request() req: AuthRequest) {
    return this.buyerService.getBuyerOffers(req.user.id);
  }

  // Get buyer trades (active transactions)
  @Get('trades')
  async getMyTrades(@Request() req: AuthRequest) {
    return this.buyerService.getBuyerTrades(req.user.id);
  }

  // Get buyer statistics
  @Get('stats')
  async getMyStats(@Request() req: AuthRequest) {
    return this.buyerService.getBuyerStats(req.user.id);
  }

  @Patch('listings/:id/status')
  async updateBuyListingStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Request() req: AuthRequest,
  ) {
    return this.buyerService.updateBuyListingStatus(id, status, req.user.id);
  }

  @Patch('listings/:id')
  async updateBuyListing(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateBuyListingDto>,
    @Request() req: AuthRequest,
  ) {
    return this.buyerService.updateBuyListing(id, updateDto, req.user.id);
  }

  @Delete('listings/:id')
  async deleteBuyListing(
    @Param('id') id: string,
    @Request() req: AuthRequest,
  ) {
    return this.buyerService.deleteBuyListing(id, req.user.id);
  }
}