import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PermissionsService } from "./services/permissions.service";
import { GoogleStrategy } from "./strategies/google.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { PrismaModule } from "../prisma/prisma.module";
import { SmsModule } from "../sms/sms.module";

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get("JWT_EXPIRES_IN", "7d"),
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    SmsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, PermissionsService, GoogleStrategy, JwtStrategy],
  exports: [AuthService, PermissionsService],
})
export class AuthModule {}
