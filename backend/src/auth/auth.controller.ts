import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Req,
  Res,
  UseGuards,
  BadRequestException,
  ConflictException,
  NotFoundException,
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
  PrivyAuthDto,
  AuthSuccessResponseDto,
  RefreshTokenResponseDto,
  TransporterRegistrationResponseDto,
  LogoutResponseDto,
  AuthProfileResponseDto,
  UpdateProfileDto,
  UpdateProfileResponseDto,
  UpdateCompanyDto,
  CompanyResponseDto,
  CreateBaseDto,
  BaseResponseDto,
  PhoneSendOtpDto,
  PhoneVerifyOtpDto,
} from "./dto/auth.dto";
import { CurrentUser } from "./decorators/current-user.decorator";
import { Public } from "./decorators/public.decorator";
import { User, UserRole, AddressType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcryptjs";
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

      // Log the mobile auth attempt
      console.log("Mobile Google auth attempt:", {
        code: code.substring(0, 10) + "...",
        redirectUri,
        role,
      });

      // Verify the ID token with Google's tokeninfo endpoint
      // Note: for mobile auth code flow, the 'code' field is expected to be a Google ID token
      const tokenInfoResponse = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${code}`,
      );
      const tokenPayload = await tokenInfoResponse.json();

      if (tokenPayload.error) {
        throw new BadRequestException(
          `Invalid Google token: ${tokenPayload.error_description || tokenPayload.error}`,
        );
      }

      // Extract user information from the verified token payload
      const googleProfile = {
        id: tokenPayload.sub,
        email: tokenPayload.email,
        firstName: tokenPayload.given_name || tokenPayload.name?.split(" ")[0] || "",
        lastName:
          tokenPayload.family_name ||
          tokenPayload.name?.split(" ").slice(1).join(" ") ||
          "",
        picture: tokenPayload.picture || "",
      };

      let user = await this.authService.validateGoogleUser(googleProfile);

      // Apply role if provided
      if (role) {
        const roleMap: Record<string, any> = {
          seller: "FARMER",
          farmer: "FARMER",
          buyer: "BUYER",
          transporter: "TRANSPORTER",
          admin: "ADMIN",
        };
        const mappedRole = roleMap[role.toLowerCase()];
        if (mappedRole && user.role !== mappedRole) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { role: mappedRole },
          });
        }
      }

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
      const { idToken, role } = body;

      // Log the native auth attempt
      console.log("Native Google auth attempt:", {
        hasIdToken: !!idToken,
        role,
      });

      if (!idToken) {
        throw new BadRequestException("Google ID token is required");
      }

      // Verify the ID token with Google's tokeninfo endpoint
      const tokenInfoResponse = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
      );
      const tokenPayload = await tokenInfoResponse.json();

      if (tokenPayload.error) {
        throw new BadRequestException(
          `Invalid Google token: ${tokenPayload.error_description || tokenPayload.error}`,
        );
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

      // Build Google profile from verified token payload
      const googleProfile = {
        id: tokenPayload.sub,
        email: tokenPayload.email,
        firstName: tokenPayload.given_name || tokenPayload.name?.split(" ")[0] || "",
        lastName:
          tokenPayload.family_name ||
          tokenPayload.name?.split(" ").slice(1).join(" ") ||
          "",
        picture: tokenPayload.picture || "",
      };

      // Create or find user based on verified token data
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
  @Post("privy/login")
  @ApiOperation({ summary: "Authenticate with Privy OAuth token" })
  @ApiBody({ type: PrivyAuthDto })
  @ApiOkResponse({ type: AuthSuccessResponseDto })
  async privyLogin(@Body() body: PrivyAuthDto) {
    try {
      const { privyToken, role, email, name } = body;

      // Log the Privy auth attempt
      console.log("Privy auth attempt:", {
        email,
        role,
        hasToken: !!privyToken,
      });

      // Verify the Privy token and extract user information
      const verifiedToken = await this.authService.verifyPrivyToken(privyToken);

      console.log("Privy token verified:", {
        sub: verifiedToken.sub,
        iss: verifiedToken.iss,
      });

      // Validate or create user in database
      const user = await this.authService.validatePrivyUser(
        verifiedToken.sub,
        email || undefined,
        name || undefined,
        role,
      );

      // Generate our app's tokens
      const result = await this.authService.login(user);

      console.log("Privy login successful:", {
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return this.serializeAuthResult(result, "Privy authentication successful");
    } catch (error: any) {
      console.error("Privy auth error:", error);
      throw new BadRequestException(
        error?.message || "Failed to authenticate with Privy",
      );
    }
  }

  @Public()
  @Post("phone/send")
  @ApiOperation({ summary: "Send OTP to phone number via SMS" })
  @ApiBody({ type: PhoneSendOtpDto })
  async phoneOtpSend(@Body() dto: PhoneSendOtpDto) {
    return this.authService.sendPhoneOtp(dto.phone);
  }

  @Public()
  @Post("phone/verify")
  @ApiOperation({ summary: "Verify phone OTP and receive JWT tokens" })
  @ApiBody({ type: PhoneVerifyOtpDto })
  @ApiOkResponse({ type: AuthSuccessResponseDto })
  async phoneOtpVerify(@Body() dto: PhoneVerifyOtpDto) {
    const result = await this.authService.verifyPhoneOtp(dto.phone, dto.code);
    return this.serializeAuthResult(result, "Phone authentication successful");
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
  async logout(@CurrentUser() _user: User) {
    void _user;
    return this.serializeLogout("Logged out successfully");
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get authenticated user profile" })
  @ApiOkResponse({ type: AuthProfileResponseDto })
  async getProfile(@CurrentUser() user: User) {
    const [companyContext, company, bases] = await Promise.all([
      this.permissionsService.getUserCompanyContext(user.id),
      this.prisma.company.findUnique({ where: { userId: user.id } }),
      this.prisma.address.findMany({
        where: { userId: user.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      }),
    ]);
    return this.serializeProfile(user, companyContext, company, bases);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update authenticated user profile" })
  @ApiBody({ type: UpdateProfileDto })
  @ApiOkResponse({ type: UpdateProfileResponseDto })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateDto: UpdateProfileDto,
  ) {
    // Check if email is being changed and if it's already in use
    if (updateDto.email && updateDto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateDto.email },
      });
      if (existingUser) {
        throw new ConflictException("Email already in use");
      }
    }

    // Check if phone number is being changed and if it's already in use
    if (updateDto.phoneNumber && updateDto.phoneNumber !== user.phoneNumber) {
      const existingUser = await this.prisma.user.findUnique({
        where: { phoneNumber: updateDto.phoneNumber },
      });
      if (existingUser) {
        throw new ConflictException("Phone number already in use");
      }
    }

    // Update the user
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: updateDto.name,
        email: updateDto.email,
        phoneNumber: updateDto.phoneNumber,
      },
    });

    const companyContext = await this.permissionsService.getUserCompanyContext(
      updatedUser.id,
    );

    return this.serializeUpdateProfile(updatedUser, companyContext);
  }

  // ==================== Company Endpoints ====================

  @Get("me/company")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get authenticated user's company" })
  @ApiOkResponse({ type: CompanyResponseDto })
  async getCompany(@CurrentUser() user: User) {
    const company = await this.prisma.company.findUnique({
      where: { userId: user.id },
      include: { addresses: true },
    });

    if (!company) {
      return { success: true, company: null };
    }

    return { success: true, company };
  }

  @Patch("me/company")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create or update authenticated user's company" })
  @ApiBody({ type: UpdateCompanyDto })
  @ApiOkResponse({ type: CompanyResponseDto })
  async upsertCompany(
    @CurrentUser() user: User,
    @Body() dto: UpdateCompanyDto,
  ) {
    const company = await this.prisma.company.upsert({
      where: { userId: user.id },
      update: {
        legalName: dto.legalName,
        registrationNumber: dto.registrationNumber,
        vatNumber: dto.vatNumber,
        phoneNumber: dto.phoneNumber,
        email: dto.email,
        website: dto.website,
      },
      create: {
        userId: user.id,
        legalName: dto.legalName || "",
        registrationNumber: dto.registrationNumber,
        vatNumber: dto.vatNumber,
        phoneNumber: dto.phoneNumber,
        email: dto.email,
        website: dto.website,
      },
    });

    return {
      success: true,
      message: "Company updated successfully",
      company,
    };
  }

  // ==================== Base (Address) Endpoints ====================

  @Get("me/bases")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get authenticated user's bases (addresses)" })
  @ApiOkResponse({ type: [BaseResponseDto] })
  async getBases(@CurrentUser() user: User) {
    const bases = await this.prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    return { success: true, bases };
  }

  @Post("me/bases")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Add a new base (address) for authenticated user" })
  @ApiBody({ type: CreateBaseDto })
  @ApiOkResponse({ type: BaseResponseDto })
  async createBase(
    @CurrentUser() user: User,
    @Body() dto: CreateBaseDto,
  ) {
    // Validate addressType against enum
    const validTypes = Object.values(AddressType);
    if (!validTypes.includes(dto.addressType as AddressType)) {
      throw new BadRequestException(
        `Invalid addressType. Must be one of: ${validTypes.join(", ")}`,
      );
    }

    // If this base is set as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const base = await this.prisma.address.create({
      data: {
        userId: user.id,
        label: dto.label,
        addressType: dto.addressType as AddressType,
        street: dto.street,
        cityId: dto.cityId,
        postalCode: dto.postalCode,
        country: dto.country,
        latitude: dto.latitude,
        longitude: dto.longitude,
        isDefault: dto.isDefault ?? false,
      },
    });

    return {
      success: true,
      message: "Base added successfully",
      base,
    };
  }

  @Patch("me/bases/:baseId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a base (address)" })
  @ApiBody({ type: CreateBaseDto })
  @ApiOkResponse({ type: BaseResponseDto })
  async updateBase(
    @CurrentUser() user: User,
    @Param("baseId") baseId: string,
    @Body() dto: CreateBaseDto,
  ) {
    // Verify the base belongs to this user
    const existing = await this.prisma.address.findFirst({
      where: { id: baseId, userId: user.id },
    });

    if (!existing) {
      throw new NotFoundException("Base not found");
    }

    // Validate addressType if provided
    if (dto.addressType) {
      const validTypes = Object.values(AddressType);
      if (!validTypes.includes(dto.addressType as AddressType)) {
        throw new BadRequestException(
          `Invalid addressType. Must be one of: ${validTypes.join(", ")}`,
        );
      }
    }

    // If this base is being set as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId: user.id, isDefault: true, id: { not: baseId } },
        data: { isDefault: false },
      });
    }

    const base = await this.prisma.address.update({
      where: { id: baseId },
      data: {
        label: dto.label,
        addressType: dto.addressType as AddressType,
        street: dto.street,
        cityId: dto.cityId,
        postalCode: dto.postalCode,
        country: dto.country,
        latitude: dto.latitude,
        longitude: dto.longitude,
        isDefault: dto.isDefault,
      },
    });

    return {
      success: true,
      message: "Base updated successfully",
      base,
    };
  }

  @Delete("me/bases/:baseId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a base (address)" })
  async deleteBase(
    @CurrentUser() user: User,
    @Param("baseId") baseId: string,
  ) {
    // Verify the base belongs to this user
    const existing = await this.prisma.address.findFirst({
      where: { id: baseId, userId: user.id },
    });

    if (!existing) {
      throw new NotFoundException("Base not found");
    }

    await this.prisma.address.delete({ where: { id: baseId } });

    return {
      success: true,
      message: "Base deleted successfully",
    };
  }

  // ==================== Private Serializers ====================

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
    company?: Record<string, any> | null,
    bases?: Record<string, any>[] | null,
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
        company: company || null,
        bases: bases || [],
      },
      { excludeExtraneousValues: false },
    );
  }

  private serializeUpdateProfile(
    user: User,
    companyContext?: Record<string, any> | null,
  ): UpdateProfileResponseDto {
    return plainToInstance(
      UpdateProfileResponseDto,
      {
        success: true,
        message: "Profile updated successfully",
        user: this.serializeProfile(user, companyContext),
      },
      { excludeExtraneousValues: false },
    );
  }
}
