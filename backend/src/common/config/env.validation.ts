import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

// NI-12: Environment variable validation schema
export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsString()
  @IsNotEmpty({ message: 'DATABASE_URL is required. Set it in backend/.env' })
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty({ message: 'JWT_SECRET is required for authentication' })
  JWT_SECRET: string;

  @IsNumber()
  @IsOptional()
  PORT: number = 4000;

  @IsString()
  @IsOptional()
  FRONTEND_URL: string;

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID: string;

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_SECRET: string;

  @IsString()
  @IsOptional()
  PRIVY_APP_ID: string;

  @IsString()
  @IsOptional()
  PRIVY_APP_SECRET: string;

  @IsString()
  @IsOptional()
  PLANTATION_ROUND_CONTRACT_ADDRESS: string;

  @IsString()
  @IsOptional()
  GROVE_STAKING_CONTRACT_ADDRESS: string;

  @IsString()
  @IsOptional()
  CELO_RPC_URL: string;

  @IsString()
  @IsOptional()
  CELO_ADMIN_PRIVATE_KEY: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .map((err) => {
        const constraints = Object.values(err.constraints || {}).join(', ');
        return `  - ${err.property}: ${constraints}`;
      })
      .join('\n');
    throw new Error(
      `\n\nEnvironment validation failed:\n${messages}\n\nCheck your backend/.env file.\n`,
    );
  }
  return validatedConfig;
}
