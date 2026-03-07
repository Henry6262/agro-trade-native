# Dual Auth + Bulgarian i18n Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add phone OTP authentication (Twilio) side-by-side with existing Privy wallet login, and add Bulgarian/English i18n to key screens.

**Architecture:** PhoneOtp Prisma model + NestJS SmsService handles OTP generation/verification and issues the same JWT as Privy. Frontend shows AuthMethodSheet with two glassmorphism tiles; OTP flow is two steps (phone input → code input). i18next with expo-localization auto-detects device locale; user can toggle EN/BG in ProfileDrawer.

**Tech Stack:** NestJS, Prisma, bcryptjs, Twilio SDK (backend) · Zustand, React Native, i18next, react-i18next, expo-localization (frontend)

---

## BACKEND TASKS (run from `backend/`)

### Task 1: Add PhoneOtp model to Prisma schema

**Files:**
- Modify: `backend/prisma/schema.prisma`

**Step 1: Add the model**

Open `backend/prisma/schema.prisma`. After the `User` model's closing brace (around line 60), add:

```prisma
model PhoneOtp {
  id        String   @id @default(cuid())
  phone     String
  codeHash  String   @map("code_hash")
  expiresAt DateTime @map("expires_at")
  used      Boolean  @default(false)
  attempts  Int      @default(0)
  createdAt DateTime @default(now()) @map("created_at")

  @@index([phone, used])
  @@map("phone_otps")
}
```

**Step 2: Run migration**

```bash
cd backend
npx prisma migrate dev --name add-phone-otp
```

Expected output:
```
✔ Generated Prisma Client
The following migration(s) have been created and applied from your schema changes:
migrations/20260307_add_phone_otp/migration.sql
```

**Step 3: Verify generated client**

```bash
npx prisma generate
```

Expected: `Generated Prisma Client (vX.X.X)`

**Step 4: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(backend): add PhoneOtp prisma model for phone OTP auth"
```

---

### Task 2: Install Twilio and create SmsService

**Files:**
- Create: `backend/src/sms/sms.service.ts`
- Create: `backend/src/sms/sms.module.ts`

**Step 1: Install Twilio**

```bash
cd backend
npm install twilio
```

**Step 2: Write failing test**

Create `backend/src/sms/sms.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';

describe('SmsService', () => {
  let service: SmsService;
  let mockTwilioCreate: jest.Mock;

  beforeEach(async () => {
    mockTwilioCreate = jest.fn().mockResolvedValue({ sid: 'SM123' });

    jest.mock('twilio', () =>
      jest.fn().mockReturnValue({
        messages: { create: mockTwilioCreate },
      }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const map: Record<string, string> = {
                TWILIO_ACCOUNT_SID: 'ACtest',
                TWILIO_AUTH_TOKEN: 'authtest',
                TWILIO_FROM_NUMBER: '+1234567890',
              };
              return map[key];
            },
          },
        },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sendOtp should call twilio messages.create with correct params', async () => {
    await service.sendOtp('+35988123456', '123456');
    // Not testing Twilio internals — just that service doesn't throw
    expect(service).toBeDefined();
  });
});
```

**Step 3: Run test to see it fail**

```bash
cd backend
npm test -- --testPathPattern=sms.service.spec
```

Expected: FAIL — `Cannot find module './sms.service'`

**Step 4: Create SmsService**

Create `backend/src/sms/sms.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly client: Twilio.Twilio;
  private readonly fromNumber: string;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get<string>('TWILIO_FROM_NUMBER') ?? '';

    if (accountSid && authToken) {
      this.client = Twilio.default(accountSid, authToken);
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
      this.logger.log(`OTP sent to ${phone.slice(-4).padStart(phone.length, '*')}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${phone}`, error);
      throw error;
    }
  }
}
```

Create `backend/src/sms/sms.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmsService } from './sms.service';

@Module({
  imports: [ConfigModule],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
```

**Step 5: Run test to verify it passes**

```bash
npm test -- --testPathPattern=sms.service.spec
```

Expected: PASS (or test skips Twilio mock — key is no crash)

**Step 6: Commit**

```bash
git add backend/src/sms/
git commit -m "feat(backend): add SmsService wrapping Twilio for OTP delivery"
```

---

### Task 3: Add phone auth DTOs

**Files:**
- Modify: `backend/src/auth/dto/auth.dto.ts`

**Step 1: Add DTOs at the bottom of `backend/src/auth/dto/auth.dto.ts`**

Open the file and add these two classes at the end (before the last closing brace if any):

```typescript
export class PhoneSendOtpDto {
  @ApiProperty({ example: '+35988123456', description: 'E.164 format phone number' })
  @IsString()
  phone: string;
}

export class PhoneVerifyOtpDto {
  @ApiProperty({ example: '+35988123456' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code' })
  @IsString()
  code: string;
}
```

You'll need these imports at the top of the file (they're likely already there; just verify):
```typescript
import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsPhoneNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
```

**Step 2: Verify file still compiles**

```bash
cd backend
npm run build 2>&1 | tail -5
```

Expected: No TS errors.

**Step 3: Commit**

```bash
git add backend/src/auth/dto/auth.dto.ts
git commit -m "feat(backend): add PhoneSendOtpDto and PhoneVerifyOtpDto"
```

---

### Task 4: Add phone OTP logic to AuthService

**Files:**
- Modify: `backend/src/auth/auth.service.ts`

**Step 1: Write failing test**

Create `backend/src/auth/phone-auth.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, TooManyRequestsException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';

describe('AuthService - Phone OTP', () => {
  let service: AuthService;
  let mockPrisma: any;
  let mockSms: any;

  beforeEach(async () => {
    mockPrisma = {
      phoneOtp: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({}),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'user-1', email: 'phone-user@agrotrade.com',
          role: 'BUYER', phoneNumber: '+35988123456',
          isActive: true, onboardingCompleted: false,
        }),
        update: jest.fn(),
      },
    };
    mockSms = { sendOtp: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('mock-jwt') } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-secret') } },
        { provide: SmsService, useValue: mockSms },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('sendPhoneOtp', () => {
    it('should hash the OTP and call SmsService', async () => {
      await service.sendPhoneOtp('+35988123456');
      expect(mockSms.sendOtp).toHaveBeenCalledWith('+35988123456', expect.any(String));
      expect(mockPrisma.phoneOtp.create).toHaveBeenCalled();
    });

    it('should throw 429 if more than 3 OTPs sent in 10 minutes', async () => {
      mockPrisma.phoneOtp.count.mockResolvedValue(3);
      await expect(service.sendPhoneOtp('+35988123456')).rejects.toThrow();
    });
  });

  describe('verifyPhoneOtp', () => {
    it('should return login result when code is correct', async () => {
      const bcrypt = require('bcryptjs');
      const code = '123456';
      const hash = await bcrypt.hash(code, 10);
      mockPrisma.phoneOtp.findFirst.mockResolvedValue({
        id: 'otp-1', codeHash: hash, expiresAt: new Date(Date.now() + 300000),
        used: false, attempts: 0,
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', phoneNumber: '+35988123456', isActive: true, onboardingCompleted: false,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1', phoneNumber: '+35988123456', isActive: true, onboardingCompleted: false,
      });
      mockPrisma.phoneOtp.update.mockResolvedValue({});

      const result = await service.verifyPhoneOtp('+35988123456', code);
      expect(result).toHaveProperty('access_token');
    });

    it('should throw BadRequestException on wrong code', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('000000', 10);
      mockPrisma.phoneOtp.findFirst.mockResolvedValue({
        id: 'otp-1', codeHash: hash, expiresAt: new Date(Date.now() + 300000),
        used: false, attempts: 2,
      });
      mockPrisma.phoneOtp.update.mockResolvedValue({});

      await expect(service.verifyPhoneOtp('+35988123456', '999999')).rejects.toThrow(BadRequestException);
    });
  });
});
```

**Step 2: Run test to see it fail**

```bash
cd backend
npm test -- --testPathPattern=phone-auth.service.spec
```

Expected: FAIL — `service.sendPhoneOtp is not a function`

**Step 3: Add phone auth methods to AuthService**

Open `backend/src/auth/auth.service.ts`.

First, add `SmsService` to the constructor. The class currently has:
```typescript
constructor(
  private prisma: PrismaService,
  private jwtService: JwtService,
  private configService: ConfigService,
) {}
```

Change it to:
```typescript
constructor(
  private prisma: PrismaService,
  private jwtService: JwtService,
  private configService: ConfigService,
  private smsService: SmsService,
) {}
```

Add `SmsService` to the import at the top:
```typescript
import { SmsService } from '../sms/sms.service';
```

Then add these two methods at the end of the class (before the closing `}`):

```typescript
/**
 * Generate a 6-digit OTP, hash it, store in PhoneOtp table, send via SMS.
 * Rate limit: max 3 sends per phone per 10 minutes.
 */
async sendPhoneOtp(phone: string): Promise<{ expiresIn: number }> {
  // Rate limit check
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const recentCount = await this.prisma.phoneOtp.count({
    where: { phone, createdAt: { gte: tenMinutesAgo } },
  });

  if (recentCount >= 3) {
    throw new BadRequestException(
      'Too many OTP requests. Please wait 10 minutes before trying again.',
    );
  }

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await this.prisma.phoneOtp.create({
    data: { phone, codeHash, expiresAt },
  });

  await this.smsService.sendOtp(phone, code);

  return { expiresIn: 300 };
}

/**
 * Verify OTP code. On success, find-or-create user by phone and issue JWT.
 * Max 5 failed attempts before OTP is invalidated.
 */
async verifyPhoneOtp(phone: string, code: string) {
  const otp = await this.prisma.phoneOtp.findFirst({
    where: { phone, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) {
    throw new BadRequestException('No valid OTP found. Please request a new code.');
  }

  if (otp.attempts >= 5) {
    await this.prisma.phoneOtp.update({ where: { id: otp.id }, data: { used: true } });
    throw new BadRequestException('OTP exhausted. Please request a new code.');
  }

  const isValid = await bcrypt.compare(code, otp.codeHash);

  if (!isValid) {
    await this.prisma.phoneOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    throw new BadRequestException('Invalid OTP code.');
  }

  // Mark OTP as used
  await this.prisma.phoneOtp.update({ where: { id: otp.id }, data: { used: true } });

  // Find or create user by phone number
  let user = await this.prisma.user.findUnique({ where: { phoneNumber: phone } });

  if (!user) {
    user = await this.prisma.user.create({
      data: {
        email: `phone-${phone.replace(/\D/g, '')}@agrotrade.local`,
        phoneNumber: phone,
        isPhoneVerified: true,
        isActive: true,
        role: 'BUYER', // default, changed during onboarding
      },
    });
  } else {
    // Mark phone as verified
    user = await this.prisma.user.update({
      where: { id: user.id },
      data: { isPhoneVerified: true },
    });
  }

  return this.login(user);
}
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern=phone-auth.service.spec
```

Expected: PASS (all tests green)

**Step 5: Commit**

```bash
git add backend/src/auth/auth.service.ts backend/src/auth/phone-auth.service.spec.ts
git commit -m "feat(backend): add sendPhoneOtp and verifyPhoneOtp to AuthService"
```

---

### Task 5: Add phone auth endpoints to AuthController + wire SmsModule

**Files:**
- Modify: `backend/src/auth/auth.controller.ts`
- Modify: `backend/src/auth/auth.module.ts`
- Modify: `backend/src/app.module.ts`

**Step 1: Add endpoints to AuthController**

Open `backend/src/auth/auth.controller.ts`.

Add to imports at the top:
```typescript
import { PhoneSendOtpDto, PhoneVerifyOtpDto } from './dto/auth.dto';
```

Add these two endpoints after the `privyLogin` method (around line 340):

```typescript
@Public()
@Post('phone/send')
@ApiOperation({ summary: 'Send OTP to phone number via SMS' })
@ApiBody({ type: PhoneSendOtpDto })
async phoneOtpSend(@Body() dto: PhoneSendOtpDto) {
  return this.authService.sendPhoneOtp(dto.phone);
}

@Public()
@Post('phone/verify')
@ApiOperation({ summary: 'Verify OTP and receive JWT tokens' })
@ApiBody({ type: PhoneVerifyOtpDto })
@ApiOkResponse({ type: AuthSuccessResponseDto })
async phoneOtpVerify(@Body() dto: PhoneVerifyOtpDto) {
  const result = await this.authService.verifyPhoneOtp(dto.phone, dto.code);
  return this.serializeAuthResult(result, 'Phone authentication successful');
}
```

**Step 2: Add SmsModule to AuthModule**

Open `backend/src/auth/auth.module.ts` and add `SmsModule` to imports:

```typescript
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [
    ConfigModule,
    SmsModule,           // ← add this
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({ ... }),
    PrismaModule,
  ],
  ...
```

**Step 3: Verify build compiles clean**

```bash
cd backend
npm run build 2>&1 | tail -10
```

Expected: No TS errors. `Successfully compiled` or similar.

**Step 4: Quick manual smoke test (optional, skip if no local DB)**

```bash
curl -s -X POST http://localhost:4000/api/auth/phone/send \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+35988000001"}' | jq .
```

Expected (dev mode, no Twilio creds): `{"expiresIn":300}` and console shows `[DEV] SMS to +35988000001: Your AgroTrade code is XXXXXX`

**Step 5: Commit**

```bash
git add backend/src/auth/auth.controller.ts backend/src/auth/auth.module.ts
git commit -m "feat(backend): add POST /auth/phone/send and /auth/phone/verify endpoints"
```

---

## FRONTEND TASKS (run from `front-end/`)

### Task 6: Add phone auth API methods to authService

**Files:**
- Modify: `front-end/src/services/authService.ts`

**Step 1: Write failing test**

Create `front-end/src/services/__tests__/phoneAuthService.test.ts`:

```typescript
import { authService } from '../authService';
import { apiClient } from '../api';

jest.mock('../api', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

const mockPost = apiClient.post as jest.Mock;

describe('authService - phone auth', () => {
  beforeEach(() => jest.clearAllMocks());

  it('phoneOtpSend calls POST /auth/phone/send', async () => {
    mockPost.mockResolvedValue({ data: { expiresIn: 300 } });
    const result = await authService.phoneOtpSend('+35988123456');
    expect(mockPost).toHaveBeenCalledWith('/auth/phone/send', { phone: '+35988123456' });
    expect(result.expiresIn).toBe(300);
  });

  it('phoneOtpVerify calls POST /auth/phone/verify', async () => {
    mockPost.mockResolvedValue({
      data: {
        access_token: 'jwt123',
        refresh_token: 'refresh123',
        user: { id: 'u1', role: 'BUYER' },
      },
    });
    const result = await authService.phoneOtpVerify('+35988123456', '123456');
    expect(mockPost).toHaveBeenCalledWith('/auth/phone/verify', {
      phone: '+35988123456',
      code: '123456',
    });
    expect(result.access_token).toBe('jwt123');
  });
});
```

**Step 2: Run test to see it fail**

```bash
cd front-end
npm test -- --testPathPattern=phoneAuthService
```

Expected: FAIL — `authService.phoneOtpSend is not a function`

**Step 3: Add methods to authService**

Open `front-end/src/services/authService.ts`. Add after the `privyLogin` method:

```typescript
// Phone OTP authentication
phoneOtpSend: async (phone: string): Promise<{ expiresIn: number }> => {
  return apiClient
    .post<{ expiresIn: number }>('/auth/phone/send', { phone })
    .then((r) => r.data);
},

phoneOtpVerify: async (
  phone: string,
  code: string,
): Promise<{ access_token: string; refresh_token: string; user: any }> => {
  return apiClient
    .post<{ access_token: string; refresh_token: string; user: any }>(
      '/auth/phone/verify',
      { phone, code },
    )
    .then((r) => r.data);
},
```

**Step 4: Run test to verify it passes**

```bash
npm test -- --testPathPattern=phoneAuthService
```

Expected: PASS

**Step 5: Commit**

```bash
git add front-end/src/services/authService.ts front-end/src/services/__tests__/phoneAuthService.test.ts
git commit -m "feat(frontend): add phoneOtpSend and phoneOtpVerify to authService"
```

---

### Task 7: Create PhoneAuthFlow screen (two-step: phone input → OTP entry)

**Files:**
- Create: `front-end/src/pages/Auth/screens/PhoneAuthScreen.tsx`

**Step 1: Create the screen**

```tsx
// front-end/src/pages/Auth/screens/PhoneAuthScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { GlassButton } from '../../../design-system/GlassButton';
import { useAuthStore } from '../../../stores/auth.store';
import { authService } from '../../../services/authService';

type Step = 'phone' | 'otp';

const COUNTRY_CODES = [
  { flag: '🇧🇬', code: '+359', label: 'BG' },
  { flag: '🇬🇧', code: '+44',  label: 'GB' },
  { flag: '🇩🇪', code: '+49',  label: 'DE' },
  { flag: '🇺🇸', code: '+1',   label: 'US' },
];

export default function PhoneAuthScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuthStore();

  const [step, setStep]             = useState<Step>('phone');
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [phone, setPhone]           = useState('');
  const [otp, setOtp]               = useState(['', '', '', '', '', '']);
  const [resendAt, setResendAt]     = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading]       = useState(false);
  const otpRefs = useRef<TextInput[]>([]);

  // Countdown timer
  useEffect(() => {
    if (!resendAt) return;
    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) clearInterval(interval);
    }, 500);
    return () => clearInterval(interval);
  }, [resendAt]);

  const fullPhone = `${countryCode.code}${phone}`;

  const handleSend = async () => {
    if (phone.length < 7) {
      Alert.alert('Invalid phone', 'Please enter a valid phone number.');
      return;
    }
    setLoading(true);
    try {
      await authService.phoneOtpSend(fullPhone);
      setResendAt(Date.now() + 60_000);
      setSecondsLeft(60);
      setStep('otp');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to send code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    if (!digit && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      Alert.alert('Incomplete code', 'Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const result = await authService.phoneOtpVerify(fullPhone, code);
      login(result.user, result.access_token, result.refresh_token);
      // Navigation handled by RootNavigator based on isAuthenticated
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Invalid code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'phone') {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
          <View style={styles.card}>
            <Text style={styles.title}>Enter your phone</Text>
            <Text style={styles.subtitle}>We'll send a 6-digit code to verify</Text>

            {/* Country code row */}
            <View style={styles.phoneRow}>
              <TouchableOpacity
                style={styles.countryBtn}
                onPress={() => {
                  // Cycle through country codes
                  const idx = COUNTRY_CODES.indexOf(countryCode);
                  setCountryCode(COUNTRY_CODES[(idx + 1) % COUNTRY_CODES.length]);
                }}
              >
                <Text style={styles.flag}>{countryCode.flag}</Text>
                <Text style={styles.countryText}>{countryCode.code}</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.phoneInput}
                placeholder="88 123 456"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                autoFocus
              />
            </View>

            <GlassButton
              label={loading ? 'Sending…' : 'Send Code'}
              onPress={handleSend}
              variant="primary"
              style={styles.cta}
            />

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // OTP step
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <View style={styles.card}>
          <Text style={styles.title}>Enter the code</Text>
          <Text style={styles.subtitle}>Sent to {fullPhone}</Text>

          {/* 6-box OTP input */}
          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => { if (r) otpRefs.current[i] = r; }}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(v) => handleOtpChange(i, v)}
                selectTextOnFocus
              />
            ))}
          </View>

          <GlassButton
            label={loading ? 'Verifying…' : 'Verify'}
            onPress={handleVerify}
            variant="primary"
            style={styles.cta}
          />

          {/* Resend */}
          <TouchableOpacity
            disabled={secondsLeft > 0}
            onPress={handleSend}
            style={styles.backBtn}
          >
            <Text style={[styles.backText, secondsLeft > 0 && styles.disabled]}>
              {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend code'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setStep('phone')} style={styles.backBtn}>
            <Text style={styles.backText}>← Change number</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0f' },
  kav: { flex: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 28,
  },
  title: { color: 'rgba(255,255,255,0.9)', fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 28 },
  phoneRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  flag: { fontSize: 20 },
  countryText: { color: 'rgba(255,255,255,0.7)', fontSize: 15 },
  phoneInput: {
    flex: 1,
    color: '#fff',
    fontSize: 17,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 28 },
  otpBox: {
    width: 46,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  otpBoxFilled: { borderColor: 'rgba(52,211,153,0.6)', backgroundColor: 'rgba(52,211,153,0.08)' },
  cta: { marginTop: 4 },
  backBtn: { alignItems: 'center', marginTop: 16 },
  backText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  disabled: { opacity: 0.4 },
});
```

**Step 2: Verify no TS errors**

```bash
cd front-end
npm run lint 2>&1 | grep -i error | head -10
```

Expected: No errors related to `PhoneAuthScreen.tsx`

**Step 3: Commit**

```bash
git add front-end/src/pages/Auth/screens/PhoneAuthScreen.tsx
git commit -m "feat(frontend): add PhoneAuthScreen (two-step phone + OTP flow)"
```

---

### Task 8: Update WelcomeScreen to AuthMethodSheet (two glassmorphism tiles)

**Files:**
- Modify: `front-end/src/pages/Auth/screens/WelcomeScreen.tsx`

**Step 1: Replace WelcomeScreen content**

Open `front-end/src/pages/Auth/screens/WelcomeScreen.tsx` and replace it entirely with:

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

interface AuthTileProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function AuthTile({ icon, title, subtitle, onPress }: AuthTileProps) {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.tileIcon}>{icon}</Text>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileSub}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Logo / wordmark */}
        <View style={styles.header}>
          <Text style={styles.logo}>🌾</Text>
          <Text style={styles.appName}>AgroTrade</Text>
          <Text style={styles.tagline}>Connect. Trade. Grow.</Text>
        </View>

        {/* Auth method tiles */}
        <Text style={styles.chooseLabel}>How would you like to sign in?</Text>
        <View style={styles.tilesRow}>
          <AuthTile
            icon="📱"
            title="Phone"
            subtitle="No crypto needed"
            onPress={() => navigation.navigate('PhoneAuth')}
          />
          <AuthTile
            icon="🔐"
            title="Wallet"
            subtitle="Privy wallet"
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0f' },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 52 },
  logo: { fontSize: 52, marginBottom: 8 },
  appName: { color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 6 },
  chooseLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tilesRow: { flexDirection: 'row', gap: 12 },
  tile: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 8,
  },
  tileIcon: { fontSize: 36 },
  tileTitle: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '700' },
  tileSub: { color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center' },
});
```

**Step 2: Add PhoneAuth to AuthStack**

Open `front-end/src/navigation/AuthStack.tsx` and update it:

```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';

import LoginScreen from '../pages/Auth/screens/LoginScreen';
import RegisterScreen from '../pages/Auth/screens/RegisterScreen';
import ForgotPasswordScreen from '../pages/Auth/screens/ForgotPasswordScreen';
import WelcomeScreen from '../pages/Auth/screens/WelcomeScreen';
import PhoneAuthScreen from '../pages/Auth/screens/PhoneAuthScreen';  // ← add

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0a0f' },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />  {/* ← add */}
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
```

**Step 3: Add PhoneAuth to navigation types**

Open `front-end/src/navigation/types.ts`. Find `AuthStackParamList` and add `PhoneAuth`:

```typescript
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  PhoneAuth: undefined;    // ← add this line
  Register: undefined;
  ForgotPassword: undefined;
};
```

**Step 4: Verify**

```bash
cd front-end
npm run lint 2>&1 | grep -i error | head -10
```

Expected: No errors.

**Step 5: Commit**

```bash
git add front-end/src/pages/Auth/screens/WelcomeScreen.tsx \
        front-end/src/navigation/AuthStack.tsx \
        front-end/src/navigation/types.ts
git commit -m "feat(frontend): transform WelcomeScreen to AuthMethodSheet with phone + wallet tiles"
```

---

## i18n TASKS

### Task 9: Install i18n libraries + create i18n init module

**Files:**
- Create: `front-end/src/i18n/index.ts`
- Create: `front-end/src/i18n/locales/en.json`
- Create: `front-end/src/i18n/locales/bg.json`
- Modify: `front-end/App.tsx`

**Step 1: Install dependencies**

```bash
cd front-end
npx expo install i18next react-i18next expo-localization
```

Expected: Packages added to `package.json`, no peer dep warnings.

**Step 2: Create locale files**

Create `front-end/src/i18n/locales/en.json`:

```json
{
  "common": {
    "loading": "Loading…",
    "error": "Something went wrong",
    "retry": "Try again",
    "save": "Save",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "back": "Back",
    "noData": "No data available"
  },
  "auth": {
    "welcome": "Welcome to AgroTrade",
    "tagline": "Connect. Trade. Grow.",
    "chooseMethod": "How would you like to sign in?",
    "phone": "Phone",
    "phoneSubtitle": "No crypto needed",
    "wallet": "Wallet",
    "walletSubtitle": "Privy wallet",
    "enterPhone": "Enter your phone",
    "enterPhoneSubtitle": "We'll send a 6-digit code to verify",
    "sendCode": "Send Code",
    "sending": "Sending…",
    "enterOtp": "Enter the code",
    "resendIn": "Resend in {{seconds}}s",
    "resend": "Resend code",
    "verify": "Verify",
    "verifying": "Verifying…",
    "changeNumber": "← Change number"
  },
  "dashboard": {
    "tabs": {
      "home": "Home",
      "marketplace": "Market",
      "orders": "Orders",
      "transport": "Transport",
      "inspect": "Inspect"
    }
  },
  "marketplace": {
    "emptyTitle": "No listings yet",
    "emptySubtitle": "Pull down to refresh",
    "search": "Search crops…"
  },
  "orders": {
    "emptyTitle": "No active orders",
    "emptySubtitle": "Visit the marketplace to place your first order"
  },
  "phases": {
    "INITIATION": "Initiated",
    "SCHEDULING": "Scheduling",
    "SCHEDULED": "Scheduled",
    "IN_TRANSIT": "In Transit",
    "DELIVERED": "Delivered",
    "INSPECTION_PENDING": "Inspection Pending",
    "INSPECTION_IN_PROGRESS": "Inspection In Progress",
    "INSPECTED": "Inspected",
    "PAYMENT_PENDING": "Payment Pending",
    "PAYMENT": "Payment",
    "COMPLETED": "Completed",
    "CANCELLED": "Cancelled",
    "TRANSPORT_MATCHING": "Finding Transport",
    "TRANSPORT_BIDDING": "Transport Bidding",
    "UNKNOWN": "Unknown"
  },
  "errors": {
    "network": "No internet connection",
    "unauthorized": "Session expired — please sign in again",
    "generic": "Something went wrong",
    "tooManyOtp": "Too many requests. Wait 10 minutes.",
    "invalidOtp": "Invalid code. Please try again."
  },
  "profile": {
    "language": "Language",
    "logout": "Sign Out",
    "settings": "Settings"
  }
}
```

Create `front-end/src/i18n/locales/bg.json`:

```json
{
  "common": {
    "loading": "Зареждане…",
    "error": "Нещо се обърка",
    "retry": "Опитай отново",
    "save": "Запази",
    "cancel": "Отказ",
    "confirm": "Потвърди",
    "back": "Назад",
    "noData": "Няма налични данни"
  },
  "auth": {
    "welcome": "Добре дошли в AgroTrade",
    "tagline": "Свържи се. Търгувай. Расти.",
    "chooseMethod": "Как искате да влезете?",
    "phone": "Телефон",
    "phoneSubtitle": "Без крипто",
    "wallet": "Портфейл",
    "walletSubtitle": "Privy портфейл",
    "enterPhone": "Въведете телефон",
    "enterPhoneSubtitle": "Ще изпратим 6-цифрен код за потвърждение",
    "sendCode": "Изпрати код",
    "sending": "Изпращане…",
    "enterOtp": "Въведете кода",
    "resendIn": "Изпрати отново след {{seconds}}с",
    "resend": "Изпрати кода отново",
    "verify": "Потвърди",
    "verifying": "Проверяване…",
    "changeNumber": "← Промени номера"
  },
  "dashboard": {
    "tabs": {
      "home": "Начало",
      "marketplace": "Пазар",
      "orders": "Поръчки",
      "transport": "Транспорт",
      "inspect": "Инспекция"
    }
  },
  "marketplace": {
    "emptyTitle": "Все още няма обяви",
    "emptySubtitle": "Плъзнете надолу за опресняване",
    "search": "Търси продукти…"
  },
  "orders": {
    "emptyTitle": "Няма активни поръчки",
    "emptySubtitle": "Посетете пазара, за да направите първата си поръчка"
  },
  "phases": {
    "INITIATION": "Инициирано",
    "SCHEDULING": "Планиране",
    "SCHEDULED": "Насрочено",
    "IN_TRANSIT": "В движение",
    "DELIVERED": "Доставено",
    "INSPECTION_PENDING": "Чака инспекция",
    "INSPECTION_IN_PROGRESS": "Инспекция в ход",
    "INSPECTED": "Инспектирано",
    "PAYMENT_PENDING": "Чака плащане",
    "PAYMENT": "Плащане",
    "COMPLETED": "Завършено",
    "CANCELLED": "Отменено",
    "TRANSPORT_MATCHING": "Търси транспорт",
    "TRANSPORT_BIDDING": "Наддаване за транспорт",
    "UNKNOWN": "Неизвестно"
  },
  "errors": {
    "network": "Няма интернет връзка",
    "unauthorized": "Сесията изтече — моля влезте отново",
    "generic": "Нещо се обърка",
    "tooManyOtp": "Твърде много заявки. Изчакайте 10 минути.",
    "invalidOtp": "Невалиден код. Моля опитайте отново."
  },
  "profile": {
    "language": "Език",
    "logout": "Изход",
    "settings": "Настройки"
  }
}
```

**Step 3: Create i18n init module**

Create `front-end/src/i18n/index.ts`:

```typescript
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import bg from './locales/bg.json';

export const LANG_STORAGE_KEY = '@agrotrade:language';
export type SupportedLang = 'en' | 'bg';

function getDeviceLang(): SupportedLang {
  const locale = Localization.getLocales()[0]?.languageCode ?? 'en';
  return locale.startsWith('bg') ? 'bg' : 'en';
}

export async function initI18n(): Promise<void> {
  const saved = await AsyncStorage.getItem(LANG_STORAGE_KEY).catch(() => null);
  const lang: SupportedLang = (saved as SupportedLang) ?? getDeviceLang();

  await i18next.use(initReactI18next).init({
    lng: lang,
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      bg: { translation: bg },
    },
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });
}

export async function setLanguage(lang: SupportedLang): Promise<void> {
  await AsyncStorage.setItem(LANG_STORAGE_KEY, lang);
  await i18next.changeLanguage(lang);
}

export { i18next };
```

**Step 4: Initialize i18n in App.tsx**

Open `front-end/App.tsx`. Find the main export/component. Add i18n init before the app renders. Look for where `AppBootstrap` or the first `useEffect` runs. Add this pattern:

After the existing imports, add:
```typescript
import { initI18n } from './src/i18n';
```

In the root component, add a `useEffect` that runs once on mount. Find where the app's loading/ready state is managed (look for `isReady` or `appState`). Add i18n init there:

```typescript
// Inside the root App component, before returning JSX:
useEffect(() => {
  initI18n().catch(console.error);
}, []);
```

If the app uses a class-based bootstrap, call `initI18n()` in the equivalent lifecycle.

**Step 5: Verify no crashes**

```bash
cd front-end
npm run lint 2>&1 | grep -i error | head -10
```

Expected: No import errors.

**Step 6: Commit**

```bash
git add front-end/src/i18n/ front-end/App.tsx front-end/package.json front-end/package-lock.json
git commit -m "feat(frontend): add i18next + expo-localization, en/bg locale files, i18n init"
```

---

### Task 10: Wire i18n into PhoneAuthScreen + WelcomeScreen

**Files:**
- Modify: `front-end/src/pages/Auth/screens/PhoneAuthScreen.tsx`
- Modify: `front-end/src/pages/Auth/screens/WelcomeScreen.tsx`

**Step 1: Update PhoneAuthScreen to use translations**

Open `front-end/src/pages/Auth/screens/PhoneAuthScreen.tsx`.

Add import at the top:
```typescript
import { useTranslation } from 'react-i18next';
```

At the top of the component function body add:
```typescript
const { t } = useTranslation();
```

Replace hardcoded strings:
- `'Enter your phone'` → `t('auth.enterPhone')`
- `'We'll send a 6-digit code to verify'` → `t('auth.enterPhoneSubtitle')`
- `loading ? 'Sending…' : 'Send Code'` → `loading ? t('auth.sending') : t('auth.sendCode')`
- `'Enter the code'` → `t('auth.enterOtp')`
- `'Sent to ...'` → stays dynamic (OK, phone number can stay literal)
- `loading ? 'Verifying…' : 'Verify'` → `loading ? t('auth.verifying') : t('auth.verify')`
- `` `Resend in ${secondsLeft}s` `` → `t('auth.resendIn', { seconds: secondsLeft })`
- `'Resend code'` → `t('auth.resend')`
- `'← Change number'` → `t('auth.changeNumber')`
- `'← Back'` → `t('common.back')`

**Step 2: Update WelcomeScreen to use translations**

Open `front-end/src/pages/Auth/screens/WelcomeScreen.tsx`.

Add:
```typescript
import { useTranslation } from 'react-i18next';
```

In the component:
```typescript
const { t } = useTranslation();
```

Replace:
- `'Connect. Trade. Grow.'` → `t('auth.tagline')`
- `'How would you like to sign in?'` → `t('auth.chooseMethod')`
- `'Phone'` / `'No crypto needed'` → `t('auth.phone')` / `t('auth.phoneSubtitle')`
- `'Wallet'` / `'Privy wallet'` → `t('auth.wallet')` / `t('auth.walletSubtitle')`

**Step 3: Verify lint**

```bash
cd front-end
npm run lint 2>&1 | grep -E "error|Error" | head -10
```

Expected: No errors.

**Step 4: Commit**

```bash
git add front-end/src/pages/Auth/screens/PhoneAuthScreen.tsx \
        front-end/src/pages/Auth/screens/WelcomeScreen.tsx
git commit -m "feat(frontend): wire i18n translations into auth screens"
```

---

### Task 11: Wire i18n into PhaseBadge

**Files:**
- Modify: `front-end/src/shared/components/PhaseBadge.tsx`

**Step 1: Update PhaseBadge to use i18n labels**

Open `front-end/src/shared/components/PhaseBadge.tsx`.

Add import:
```typescript
import { useTranslation } from 'react-i18next';
```

The current `PHASE_CONFIG` has hardcoded `label` strings. Change the component to look up labels from i18n instead:

Inside the `PhaseBadge` component function (before `return`), add:
```typescript
const { t } = useTranslation();
const config = PHASE_CONFIG[phase] ?? DEFAULT_CONFIG;
const label = t(`phases.${phase}`, { defaultValue: config.label });
```

In the JSX, replace `{config.label}` with `{label}`.

The `PHASE_CONFIG.label` values can remain as English fallbacks — they're used as `defaultValue` when a key is missing.

**Step 2: Verify lint**

```bash
cd front-end
npm run lint 2>&1 | grep -E "error|Error" | head -10
```

Expected: No errors.

**Step 3: Commit**

```bash
git add front-end/src/shared/components/PhaseBadge.tsx
git commit -m "feat(frontend): PhaseBadge uses i18n translations for phase labels"
```

---

### Task 12: Add language switcher to ProfileDrawer

**Files:**
- Modify: `front-end/src/features/dashboard/components/ProfileDrawer.tsx`

**Step 1: Add language toggle UI**

Open `front-end/src/features/dashboard/components/ProfileDrawer.tsx`.

Add imports at top:
```typescript
import { useTranslation } from 'react-i18next';
import { setLanguage, type SupportedLang } from '../../../i18n';
import i18next from 'i18next';
```

Inside the component function (near the top, with other `useState`s):
```typescript
const { t } = useTranslation();
const [currentLang, setCurrentLang] = React.useState<SupportedLang>(
  (i18next.language as SupportedLang) ?? 'en'
);

const handleLanguageToggle = async (lang: SupportedLang) => {
  await setLanguage(lang);
  setCurrentLang(lang);
};
```

In the JSX, find the Settings/account section of the drawer and add the language switcher. Look for a logical grouping (around the logout button area) and insert:

```tsx
{/* Language switcher */}
<View style={langStyles.row}>
  <Text style={langStyles.label}>{t('profile.language')}</Text>
  <View style={langStyles.pills}>
    {(['en', 'bg'] as SupportedLang[]).map((lang) => (
      <TouchableOpacity
        key={lang}
        style={[langStyles.pill, currentLang === lang && langStyles.pillActive]}
        onPress={() => handleLanguageToggle(lang)}
      >
        <Text style={[langStyles.pillText, currentLang === lang && langStyles.pillTextActive]}>
          {lang.toUpperCase()}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
</View>
```

Add the styles (you can append to the existing `StyleSheet.create` in the file, or add a new `langStyles` const):

```typescript
const langStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 15 },
  pills: { flexDirection: 'row', gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  pillActive: {
    backgroundColor: 'rgba(52,211,153,0.2)',
    borderColor: 'rgba(52,211,153,0.5)',
  },
  pillText: { color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: '600' },
  pillTextActive: { color: '#34D399' },
});
```

**Step 2: Verify lint**

```bash
cd front-end
npm run lint 2>&1 | grep -E "error|Error" | head -10
```

Expected: No errors.

**Step 3: Commit**

```bash
git add front-end/src/features/dashboard/components/ProfileDrawer.tsx
git commit -m "feat(frontend): add EN/BG language switcher to ProfileDrawer"
```

---

## FINAL TASKS

### Task 13: Add Twilio env vars to Railway

**This is a manual step — you do it in the Railway dashboard.**

1. Go to https://railway.app → project `agro-trade-backend` → service `agro-trade-native`
2. Click **Variables** tab
3. Add these three env vars:
   ```
   TWILIO_ACCOUNT_SID = ACxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN  = xxxxxxxxxxxxxx
   TWILIO_FROM_NUMBER = +1xxxxxxxxxx
   ```
4. Railway will auto-redeploy

**After adding vars, verify the service starts cleanly:**

```bash
# Check Railway deployment logs — should see no Twilio errors at startup
# The SmsService gracefully logs [DEV] mode if creds are missing, so no crash
```

---

### Task 14: Integration smoke test (manual QA checklist)

Run through each scenario manually in the Expo app:

**Phone auth:**
- [ ] WelcomeScreen shows two tiles (Phone + Wallet)
- [ ] Tapping Wallet navigates to existing login flow
- [ ] Tapping Phone opens PhoneAuthScreen with country code (🇧🇬 +359 default)
- [ ] Tapping a different country code cycles to next option
- [ ] Entering phone + tapping Send Code → OTP screen appears
- [ ] 6-box OTP entry with auto-advance between digits
- [ ] Resend timer shows countdown (60s)
- [ ] After resend timer: Resend button becomes tappable
- [ ] Entering correct OTP from Twilio SMS → logged in successfully
- [ ] After login: navigates to Onboarding (new user) or Dashboard (returning user)

**i18n:**
- [ ] On Bulgarian device: app launches in Bulgarian
- [ ] On English device: app launches in English
- [ ] ProfileDrawer shows `EN BG` pills
- [ ] Tapping BG: all translated strings switch immediately (no reload)
- [ ] Restarting app: language preference persists
- [ ] PhaseBadge labels show in correct language
- [ ] Auth screens show correct language
- [ ] Tapping EN: switches back to English

---

### Task 15: Push and create PR

**Step 1: Run lint one final time**

```bash
cd front-end && npm run lint
cd ../backend && npm run lint
```

Expected: No errors.

**Step 2: Push and open PR**

```bash
git push origin main
```

Or if working on a feature branch:

```bash
git push origin feature/dual-auth-i18n
gh pr create \
  --title "feat: phone OTP auth + Bulgarian i18n" \
  --body "Adds Twilio-powered phone OTP authentication alongside existing Privy wallet login, and Bulgarian/English localisation for key screens."
```

---

## Environment Variables Reference

### Backend (`.env` local + Railway)

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+1xxxxxxxxxx
```

### Frontend (`.env`)

No new env vars needed.

---

## Files Changed Summary

| File | Action |
|------|--------|
| `backend/prisma/schema.prisma` | Add PhoneOtp model |
| `backend/src/sms/sms.service.ts` | Create (Twilio wrapper) |
| `backend/src/sms/sms.module.ts` | Create |
| `backend/src/sms/sms.service.spec.ts` | Create (tests) |
| `backend/src/auth/dto/auth.dto.ts` | Add PhoneSendOtpDto, PhoneVerifyOtpDto |
| `backend/src/auth/auth.service.ts` | Add sendPhoneOtp, verifyPhoneOtp, inject SmsService |
| `backend/src/auth/phone-auth.service.spec.ts` | Create (tests) |
| `backend/src/auth/auth.controller.ts` | Add POST /auth/phone/send + /verify |
| `backend/src/auth/auth.module.ts` | Import SmsModule |
| `front-end/src/services/authService.ts` | Add phoneOtpSend, phoneOtpVerify |
| `front-end/src/services/__tests__/phoneAuthService.test.ts` | Create (tests) |
| `front-end/src/pages/Auth/screens/PhoneAuthScreen.tsx` | Create |
| `front-end/src/pages/Auth/screens/WelcomeScreen.tsx` | Replace with AuthMethodSheet |
| `front-end/src/navigation/AuthStack.tsx` | Add PhoneAuth screen |
| `front-end/src/navigation/types.ts` | Add PhoneAuth to AuthStackParamList |
| `front-end/src/i18n/index.ts` | Create (init + language switcher) |
| `front-end/src/i18n/locales/en.json` | Create |
| `front-end/src/i18n/locales/bg.json` | Create |
| `front-end/App.tsx` | Call initI18n() on mount |
| `front-end/src/shared/components/PhaseBadge.tsx` | Use i18n labels |
| `front-end/src/features/dashboard/components/ProfileDrawer.tsx` | Add EN/BG switcher |
