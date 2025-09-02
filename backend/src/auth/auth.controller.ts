import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  Body,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
// DTOs removed temporarily
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    // Google OAuth callback
    const result = await this.authService.login(req.user);
    
    // Log the user information we got from Google
    console.log('Google OAuth User Info:', {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      hasProfile: result.user.hasProfile,
    });
    
    // Redirect to frontend with tokens and user info
    // Determine the frontend URL based on environment
    let frontendUrl = this.configService.get<string>('CLIENT_URL');
    
    // In production, use the proper frontend URLs based on deployment
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      // Check if we have a specific production URL configured
      if (process.env.CLIENT_PRODUCTION_URL) {
        // Use the production URL from environment
        frontendUrl = process.env.CLIENT_PRODUCTION_URL;
      } else if (process.env.VERCEL_URL) {
        // If deployed on Vercel, construct the frontend URL
        frontendUrl = 'https://agro-trade-native.vercel.app';
      } else {
        // Fallback
        frontendUrl = frontendUrl || 'https://agro-trade-native.vercel.app';
      }
    }
    
    // Fallback to localhost for development
    if (!frontendUrl) {
      frontendUrl = 'http://localhost:8081';
    }
    
    console.log('Redirecting to frontend URL:', frontendUrl, 'Environment:', process.env.NODE_ENV);
    
    const params = new URLSearchParams({
      accessToken: result.access_token,
      hasProfile: String(result.user.hasProfile),
      // Add user information to the redirect
      userId: result.user.id,
      userEmail: result.user.email || '',
      userName: result.user.name || '',
    });
    
    res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
  }

  @Public()
  // Refresh token endpoint temporarily disabled

  // Register with company endpoint temporarily disabled

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: User) {
    // In JWT, logout is handled client-side by removing the token
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}