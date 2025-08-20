import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getAppInfo() {
    return {
      name: 'Agro-Trade Backend API',
      version: '1.0.0',
      description: 'Agricultural Trading Marketplace Backend API',
      environment: this.configService.get('NODE_ENV'),
      timestamp: new Date().toISOString(),
    };
  }

  getStatus() {
    return {
      status: 'OK',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: this.configService.get('NODE_ENV'),
    };
  }
}