import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { AuthService, JwtPayload } from "../auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get("JWT_SECRET"),
    });
  }

  async validate(payload: JwtPayload) {
    console.log('JWT Payload:', JSON.stringify(payload));
    const user = await this.authService.getUserById(payload.sub);
    console.log('JWT User found:', user ? user.email : 'NONE');

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Note: User status checking can be added when needed
    // Future: Add status field to User model if account suspension is required

    return user;
  }
}
