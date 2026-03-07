import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';

describe('SmsService', () => {
  let service: SmsService;

  const mockConfigService = {
    get: (key: string) => {
      // No Twilio creds → dev mode
      return undefined;
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sendOtp should not throw in dev mode (no Twilio creds)', async () => {
    // In dev mode (no TWILIO_ACCOUNT_SID), sendOtp logs and returns
    await expect(service.sendOtp('+35988123456', '123456')).resolves.not.toThrow();
  });
});
