import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';

type TwilioClient = ReturnType<typeof Twilio>;

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly client: TwilioClient | null = null;
  private readonly fromNumber: string;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const fromNumber = this.configService.get<string>('TWILIO_FROM_NUMBER');
    this.fromNumber = fromNumber ?? '';

    if (accountSid && authToken && fromNumber) {
      this.client = Twilio(accountSid, authToken);
    } else if (accountSid || authToken || fromNumber) {
      // Some vars set but not all — warn about misconfiguration
      this.logger.warn('Twilio partially configured — SMS disabled. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER.');
    }
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    const body = `Your AgroTrade code is ${code}. Valid for 5 minutes.`;

    if (!this.client) {
      // Dev mode: log instead of sending
      const maskedDev = phone.slice(-4).padStart(phone.length, '*');
      this.logger.warn(`[DEV] OTP would be sent to ${maskedDev} (set TWILIO_* env vars to enable SMS)`);
      return;
    }

    try {
      await this.client.messages.create({
        body,
        from: this.fromNumber,
        to: phone,
      });
      // Log only last 4 digits of phone for privacy
      const masked = phone.slice(-4).padStart(phone.length, '*');
      this.logger.log(`OTP sent to ${masked}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP`, error);
      throw error;
    }
  }
}
