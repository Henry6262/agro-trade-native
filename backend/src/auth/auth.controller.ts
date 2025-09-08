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
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: any) {
    // Initiates Google OAuth flow
    // The request origin will help determine the correct callback URL
    console.log('Google OAuth initiated from:', req.headers.host);
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
    // Determine the frontend URL based on the request origin
    let frontendUrl = this.configService.get<string>('CLIENT_URL');
    
    // Check if the request came from an IP address (mobile emulator)
    const host = req.headers.host;
    console.log('OAuth callback - Request host:', host);
    
    if (host && host.includes('192.168.')) {
      // Request came from IP address, redirect to IP-based frontend
      const ipAddress = host.split(':')[0];
      frontendUrl = `http://${ipAddress}:8081`;
    } else if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      // In production, use the proper frontend URLs based on deployment
      // Use the stable production frontend URL
      // Don't use VERCEL_URL as it changes with each deployment
      frontendUrl = process.env.CLIENT_PRODUCTION_URL || 'https://agro-trade-native.vercel.app';
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

  @Public()
  @Post('google/mobile')
  async googleMobileAuth(@Body() body: { code: string; redirectUri: string; role?: string }) {
    try {
      // Exchange the authorization code for tokens using Google's OAuth2 API
      const { code, redirectUri, role } = body;
      
      // This would typically call Google's token endpoint to exchange the code
      // For now, we'll implement a simplified version
      // In production, you'd use Google's OAuth2 client library
      
      // Log the mobile auth attempt
      console.log('Mobile Google auth attempt:', { code: code.substring(0, 10) + '...', redirectUri, role });
      
      // For demo purposes, create or find a user
      // In production, you'd verify the code with Google and get user info
      const googleProfile = {
        id: 'google-' + Date.now(),
        email: 'mobile.user@example.com',
        firstName: 'Mobile',
        lastName: 'User',
        picture: '',
      };
      
      const user = await this.authService.validateGoogleUser(googleProfile);
      const result = await this.authService.login(user);
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('Mobile Google auth error:', error);
      throw error;
    }
  }
  
  @Public()
  @Post('google/native')
  async googleNativeAuth(@Body() body: { 
    idToken: string; 
    role?: string;
    userInfo?: {
      id: string;
      email: string;
      name: string;
      givenName?: string;
      familyName?: string;
      photo?: string;
    };
  }) {
    try {
      const { idToken, role, userInfo } = body;
      
      // Log the native auth attempt
      console.log('Native Google auth attempt:', { 
        email: userInfo?.email,
        role,
        hasIdToken: !!idToken 
      });
      
      // In production, you would:
      // 1. Verify the ID token with Google's API
      // 2. Extract user information from the verified token
      // 3. Create or update user in your database
      
      // For now, we'll trust the userInfo provided
      // WARNING: In production, ALWAYS verify the ID token!
      
      if (!userInfo?.email) {
        throw new Error('Email is required');
      }
      
      // Map frontend role names to backend UserRole enum
      let mappedRole: UserRole | undefined;
      if (role) {
        const roleMap: Record<string, UserRole> = {
          'seller': UserRole.FARMER,  // Frontend uses 'seller', backend uses 'FARMER'
          'farmer': UserRole.FARMER,
          'buyer': UserRole.BUYER,
          'transporter': UserRole.TRANSPORTER,
          'admin': UserRole.ADMIN,
        };
        mappedRole = roleMap[role.toLowerCase()];
      }
      
      // Create or find user based on email
      const googleProfile = {
        id: userInfo.id,
        email: userInfo.email,
        firstName: userInfo.givenName || userInfo.name?.split(' ')[0] || '',
        lastName: userInfo.familyName || userInfo.name?.split(' ').slice(1).join(' ') || '',
        picture: userInfo.photo || '',
      };
      
      // Use the existing Google user validation with role
      const user = await this.authService.validateGoogleUser(googleProfile);
      
      // Update user role if provided and different
      if (mappedRole && user.role !== mappedRole) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { role: mappedRole },
        });
        user.role = mappedRole;
      }
      
      const result = await this.authService.login(user);
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('Native Google auth error:', error);
      throw error;
    }
  }

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