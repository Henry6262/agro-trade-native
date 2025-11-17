import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { PermissionsService } from "./services/permissions.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import {
  LoginDto,
  RegisterDto,
  TransporterRegisterDto,
  RefreshTokenDto,
  GoogleMobileAuthDto,
  GoogleNativeAuthDto,
  AuthSuccessResponseDto,
  RefreshTokenResponseDto,
  TransporterRegistrationResponseDto,
  LogoutResponseDto,
  AuthProfileResponseDto,
} from "./dto/auth.dto";
import { CurrentUser } from "./decorators/current-user.decorator";
import { Public } from "./decorators/public.decorator";
import { User, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import {
  ApiTags,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { plainToInstance } from "class-transformer";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private permissionsService: PermissionsService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  @Public()
  @Get("google")
  @UseGuards(AuthGuard("google"))
  async googleAuth(@Req() req: any) {
    // Initiates Google OAuth flow
    // The request origin will help determine the correct callback URL
    console.log("Google OAuth initiated from:", req.headers.host);
  }

  @Public()
  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    // Google OAuth callback
    const result = await this.authService.login(req.user);

    // Log the user information we got from Google
    console.log("Google OAuth User Info:", {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      hasProfile: result.user.hasProfile,
    });

    // Redirect to frontend with tokens and user info
    // Determine the frontend URL based on the request origin
    let frontendUrl = this.configService.get<string>("CLIENT_URL");

    // Check if the request came from an IP address (mobile emulator)
    const host = req.headers.host;
    console.log("OAuth callback - Request host:", host);

    if (host && host.includes("192.168.")) {
      // Request came from IP address, redirect to IP-based frontend
      const ipAddress = host.split(":")[0];
      frontendUrl = `http://${ipAddress}:8081`;
    } else if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      // In production, use the proper frontend URLs based on deployment
      // Use the stable production frontend URL
      // Don't use VERCEL_URL as it changes with each deployment
      frontendUrl =
        process.env.CLIENT_PRODUCTION_URL ||
        "https://agro-trade-native.vercel.app";
    }

    // Fallback to localhost for development
    if (!frontendUrl) {
      frontendUrl = "http://localhost:8081";
    }

    console.log(
      "Redirecting to frontend URL:",
      frontendUrl,
      "Environment:",
      process.env.NODE_ENV,
    );

    const params = new URLSearchParams({
      accessToken: result.access_token,
      hasProfile: String(result.user.hasProfile),
      // Add user information to the redirect
      userId: result.user.id,
      userEmail: result.user.email || "",
      userName: result.user.name || "",
    });

    res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
  }

  @Public()
  // Refresh token endpoint temporarily disabled

  // Register with company endpoint temporarily disabled
  @Public()
  @Post("google/mobile")
  @ApiOperation({ summary: "Authenticate mobile app users with Google OAuth" })
  @ApiBody({ type: GoogleMobileAuthDto })
  @ApiOkResponse({ type: AuthSuccessResponseDto })
  async googleMobileAuth(@Body() body: GoogleMobileAuthDto) {
    try {
      // Exchange the authorization code for tokens using Google's OAuth2 API
      const { code, redirectUri, role } = body;

      // This would typically call Google's token endpoint to exchange the code
      // For now, we'll implement a simplified version
      // In production, you'd use Google's OAuth2 client library

      // Log the mobile auth attempt
      console.log("Mobile Google auth attempt:", {
        code: code.substring(0, 10) + "...",
        redirectUri,
        role,
      });

      // For demo purposes, create or find a user
      // In production, you'd verify the code with Google and get user info
      const googleProfile = {
        id: "google-" + Date.now(),
        email: "mobile.user@example.com",
        firstName: "Mobile",
        lastName: "User",
        picture: "",
      };

      const user = await this.authService.validateGoogleUser(googleProfile);
      const result = await this.authService.login(user);

      return this.serializeAuthResult(result);
    } catch (error: any) {
      console.error("Mobile Google auth error:", error);
      throw new BadRequestException(
        error?.message || "Failed to authenticate with Google",
      );
    }
  }

  @Public()
  @Post("google/native")
  @ApiOperation({ summary: "Authenticate native apps with Google ID token" })
  @ApiBody({ type: GoogleNativeAuthDto })
  @ApiOkResponse({ type: AuthSuccessResponseDto })
  async googleNativeAuth(@Body() body: GoogleNativeAuthDto) {
    try {
      const { idToken, role, userInfo } = body;

      // Log the native auth attempt
      console.log("Native Google auth attempt:", {
        email: userInfo?.email,
        role,
        hasIdToken: !!idToken,
      });

      // In production, you would:
      // 1. Verify the ID token with Google's API
      // 2. Extract user information from the verified token
      // 3. Create or update user in your database

      // For now, we'll trust the userInfo provided
      // WARNING: In production, ALWAYS verify the ID token!

      if (!userInfo?.email) {
        throw new Error("Email is required");
      }

      // Map frontend role names to backend UserRole enum
      let mappedRole: UserRole | undefined;
      if (role) {
        const roleMap: Record<string, UserRole> = {
          seller: UserRole.FARMER, // Frontend uses 'seller', backend uses 'FARMER'
          farmer: UserRole.FARMER,
          buyer: UserRole.BUYER,
          transporter: UserRole.TRANSPORTER,
          admin: UserRole.ADMIN,
        };
        mappedRole = roleMap[role.toLowerCase()];
      }

      // Create or find user based on email
      const googleProfile = {
        id: userInfo.id,
        email: userInfo.email,
        firstName: userInfo.givenName || userInfo.name?.split(" ")[0] || "",
        lastName:
          userInfo.familyName ||
          userInfo.name?.split(" ").slice(1).join(" ") ||
          "",
        picture: userInfo.photo || "",
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

      return this.serializeAuthResult(result);
    } catch (error: any) {
      console.error("Native Google auth error:", error);
      throw new BadRequestException(
        error?.message || "Failed to authenticate with Google",
      );
    }
  }

  @Public()
  @Post("login")
  @ApiOperation({ summary: "Authenticate user with email and password" })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthSuccessResponseDto })
  async login(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new BadRequestException("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException("Invalid credentials");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new BadRequestException("Account is not active");
    }

    // Generate tokens
    const result = await this.authService.login(user);

    return this.serializeAuthResult(result);
  }

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiBody({ type: RegisterDto })
  @ApiOkResponse({ type: AuthSuccessResponseDto })
  async register(@Body() registerDto: RegisterDto) {
    const { email, password, name, phoneNumber, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException("Email already registered");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phoneNumber,
        role,
        isActive: true,
        isEmailVerified: false,
      },
    });

    // Generate tokens
    const result = await this.authService.login(user);

    return this.serializeAuthResult(result, "Registration successful");
  }

  @Public()
  @Post("register/transporter")
  @ApiOperation({ summary: "Register a new transporter" })
  @ApiBody({ type: TransporterRegisterDto })
  @ApiOkResponse({ type: TransporterRegistrationResponseDto })
  async registerTransporter(@Body() dto: TransporterRegisterDto) {
    const {
      email,
      password,
      name,
      phoneNumber,
      companyName,
      licenseNumber,
      fleetSize,
      baseLocation,
      coordinates,
      insuranceProvider,
      insurancePolicyNumber,
    } = dto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException("Email already registered");
    }

    // For now, we'll store license number in metadata
    // In production, you'd want a separate Transporter table

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with transporter metadata
    // Since we don't have a separate Transporter model, we'll store the data in the User model
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phoneNumber,
        role: UserRole.TRANSPORTER,
        isActive: true,
        isEmailVerified: false,
        onboardingCompleted: false,
        // Store transporter-specific data in company relation
        company: {
          create: {
            legalName: companyName,
            registrationNumber: licenseNumber,
            phoneNumber: phoneNumber,
            email: email,
            // Store additional transporter data in addresses for now
            // In a production system, you'd have a dedicated Transporter model
          },
        },
      },
      include: {
        company: true,
      },
    });

    // Generate tokens
    const authResult = await this.authService.login(user);

    return this.serializeTransporterResult(
      authResult,
      {
        companyName: user.company?.legalName,
        licenseNumber: user.company?.registrationNumber,
        fleetSize: fleetSize || 1,
      },
      "Transporter registration successful",
    );
  }

  @Public()
  @Post("refresh")
  @ApiOperation({ summary: "Refresh access token using a refresh token" })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({ type: RefreshTokenResponseDto })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(dto.refreshToken);
    return this.serializeRefreshResult(result);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout current user" })
  @ApiOkResponse({ type: LogoutResponseDto })
  async logout(@CurrentUser() user: User) {
    return this.serializeLogout("Logged out successfully");
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get authenticated user profile" })
  @ApiOkResponse({ type: AuthProfileResponseDto })
  async getProfile(@CurrentUser() user: User) {
    const companyContext = await this.permissionsService.getUserCompanyContext(
      user.id,
    );
    return this.serializeProfile(user, companyContext);
  }

  private serializeAuthResult(
    result: any,
    message?: string,
  ): AuthSuccessResponseDto {
    if (!result?.user) {
      throw new BadRequestException("Invalid authentication response");
    }

    return plainToInstance(
      AuthSuccessResponseDto,
      {
        success: true,
        message,
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          phoneNumber: result.user.phoneNumber,
          role: result.user.role,
          hasProfile:
            result.user.hasProfile ?? result.user.onboardingCompleted ?? false,
        },
      },
      { excludeExtraneousValues: false },
    );
  }

  private serializeTransporterResult(
    result: any,
    transporter: Record<string, any>,
    message?: string,
  ): TransporterRegistrationResponseDto {
    const base = this.serializeAuthResult(result, message);
    return plainToInstance(
      TransporterRegistrationResponseDto,
      {
        success: base.success,
        message: base.message,
        access_token: base.access_token,
        refresh_token: base.refresh_token,
        user: base.user,
        transporter,
      },
      { excludeExtraneousValues: false },
    );
  }

  private serializeRefreshResult(result: any): RefreshTokenResponseDto {
    if (!result?.access_token || !result?.refresh_token) {
      throw new BadRequestException("Invalid refresh token response");
    }

    return plainToInstance(
      RefreshTokenResponseDto,
      {
        success: true,
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      },
      { excludeExtraneousValues: false },
    );
  }

  private serializeLogout(message: string): LogoutResponseDto {
    return plainToInstance(
      LogoutResponseDto,
      {
        success: true,
        message,
      },
      { excludeExtraneousValues: false },
    );
  }

  private serializeProfile(
    user: User,
    companyContext?: Record<string, any> | null,
  ): AuthProfileResponseDto {
    return plainToInstance(
      AuthProfileResponseDto,
      {
        id: user.id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        createdAt: user.createdAt?.toISOString?.() ?? new Date().toISOString(),
        updatedAt: user.updatedAt?.toISOString?.() ?? new Date().toISOString(),
        companyContext,
      },
      { excludeExtraneousValues: false },
    );
  }
}
