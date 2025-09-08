import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SellerService } from './seller.service';
import { CreateListingDto, ListingStatus } from './dto/create-listing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthRequest {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('seller')
@UseGuards(JwtAuthGuard)
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Post('listings')
  async createListing(
    @Body() createListingDto: CreateListingDto,
    @Request() req: AuthRequest,
  ) {
    return this.sellerService.createListing(createListingDto, req.user.id);
  }

  @Get('listings')
  async getMyListings(@Request() req: AuthRequest) {
    return this.sellerService.getSellerListings(req.user.id);
  }

  @Get('listings/:id')
  async getListingById(
    @Param('id') id: string,
    @Request() req: AuthRequest,
  ) {
    return this.sellerService.getListingById(id, req.user.id);
  }

  // Alias endpoint for frontend compatibility - returns listings formatted as products
  @Get('products')
  async getMyProducts(@Request() req: AuthRequest) {
    return this.sellerService.getSellerProducts(req.user.id);
  }

  // Get seller offers (incoming purchase requests)
  @Get('offers')
  async getMyOffers(@Request() req: AuthRequest) {
    return this.sellerService.getSellerOffers(req.user.id);
  }

  // Get seller trades (active transactions)
  @Get('trades')
  async getMyTrades(@Request() req: AuthRequest) {
    return this.sellerService.getSellerTrades(req.user.id);
  }

  // Get seller statistics
  @Get('stats')
  async getMyStats(@Request() req: AuthRequest) {
    return this.sellerService.getSellerStats(req.user.id);
  }

  @Patch('listings/:id/status')
  async updateListingStatus(
    @Param('id') id: string,
    @Body('status') status: ListingStatus,
    @Request() req: AuthRequest,
  ) {
    return this.sellerService.updateListingStatus(id, status, req.user.id);
  }
}