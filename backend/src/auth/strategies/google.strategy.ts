import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";
import { AuthService, GoogleProfile } from "../auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    // Determine callback URL based on environment
    let callbackURL = configService.get("GOOGLE_CALLBACK_URL");

    // In production, use the proper callback URL
    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      callbackURL = process.env.API_PRODUCTION_URL
        ? `${process.env.API_PRODUCTION_URL}/auth/google/callback`
        : "https://be-agro-trade-native.vercel.app/api/auth/google/callback";
    }

    super({
      clientID: configService.get("GOOGLE_CLIENT_ID"),
      clientSecret: configService.get("GOOGLE_CLIENT_SECRET"),
      callbackURL:
        callbackURL || "http://localhost:4000/api/auth/google/callback",
      scope: ["email", "profile"],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const googleProfile: GoogleProfile = {
      id: profile.id,
      email: profile.emails[0].value,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      picture: profile.photos[0].value,
    };

    const user = await this.authService.validateGoogleUser(googleProfile);
    done(null, user);
  }
}
