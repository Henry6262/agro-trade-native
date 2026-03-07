import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import * as bcrypt from 'bcryptjs';

describe('AuthService - Phone OTP', () => {
  let service: AuthService;
  let mockPrisma: any;
  let mockSms: any;

  beforeEach(async () => {
    mockPrisma = {
      phoneOtp: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 'otp-1' }),
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'phone-35988123456@agrotrade.local',
          role: 'BUYER',
          phoneNumber: '+35988123456',
          isActive: true,
          onboardingCompleted: false,
        }),
        update: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'phone-35988123456@agrotrade.local',
          role: 'BUYER',
          phoneNumber: '+35988123456',
          isActive: true,
          onboardingCompleted: false,
          lastLogin: null,
        }),
      },
    };
    mockSms = { sendOtp: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-value') },
        },
        { provide: SmsService, useValue: mockSms },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('sendPhoneOtp', () => {
    it('should create OTP record and call SmsService', async () => {
      const result = await service.sendPhoneOtp('+35988123456');
      expect(mockSms.sendOtp).toHaveBeenCalledWith('+35988123456', expect.stringMatching(/^\d{6}$/));
      expect(mockPrisma.phoneOtp.create).toHaveBeenCalled();
      expect(result.expiresIn).toBe(300);
    });

    it('should throw BadRequestException if 3+ OTPs sent in 10 minutes', async () => {
      mockPrisma.phoneOtp.count.mockResolvedValue(3);
      await expect(service.sendPhoneOtp('+35988123456')).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyPhoneOtp', () => {
    it('should return login tokens when code is correct', async () => {
      const code = '123456';
      const hash = await bcrypt.hash(code, 10);
      mockPrisma.phoneOtp.findFirst.mockResolvedValue({
        id: 'otp-1',
        codeHash: hash,
        expiresAt: new Date(Date.now() + 300_000),
        used: false,
        attempts: 0,
      });

      const result = await service.verifyPhoneOtp('+35988123456', code);
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });

    it('should throw BadRequestException on wrong code', async () => {
      const hash = await bcrypt.hash('000000', 10);
      mockPrisma.phoneOtp.findFirst.mockResolvedValue({
        id: 'otp-1',
        codeHash: hash,
        expiresAt: new Date(Date.now() + 300_000),
        used: false,
        attempts: 0,
      });

      await expect(service.verifyPhoneOtp('+35988123456', '999999')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when attempts >= 5', async () => {
      const hash = await bcrypt.hash('123456', 10);
      mockPrisma.phoneOtp.findFirst.mockResolvedValue({
        id: 'otp-1',
        codeHash: hash,
        expiresAt: new Date(Date.now() + 300_000),
        used: false,
        attempts: 5,
      });

      await expect(service.verifyPhoneOtp('+35988123456', '123456')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when no valid OTP found', async () => {
      mockPrisma.phoneOtp.findFirst.mockResolvedValue(null);
      await expect(service.verifyPhoneOtp('+35988123456', '123456')).rejects.toThrow(BadRequestException);
    });
  });
});
