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
    this.fromNumber = this.configService.get<string>('TWILIO_FROM_NUMBER') ?? '';

    if (accountSid && authToken) {
      this.client = Twilio(accountSid, authToken);
    }
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    const body = `Your AgroTrade code is ${code}. Valid for 5 minutes.`;

    if (!this.client) {
      // Dev mode: log instead of sending
      this.logger.warn(`[DEV] SMS to ${phone}: ${body}`);
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
