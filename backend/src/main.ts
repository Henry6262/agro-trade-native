import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

let cachedApp: NestExpressApplication;

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    
    // Enable CORS with environment-based configuration
    const corsOrigins = process.env.CORS_ORIGINS?.split(',').map(origin => origin.trim()) || [];
    const allowAllOrigins = process.env.CORS_ALLOW_ALL === 'true';
    
    app.enableCors({
      origin: (origin, callback) => {
        // In development or if explicitly allowing all origins
        if (process.env.NODE_ENV !== 'production' || allowAllOrigins) {
          callback(null, true);
          return;
        }
        
        // In production, check against allowed origins
        const allowedOrigins = [
          ...corsOrigins,
          // Always allow localhost for development
          'http://localhost:3000',
          'http://localhost:8081',
          'http://localhost:8082',
          'http://localhost:19006',
        ];
        
        // Check if origin is allowed
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          // Check for pattern matching (e.g., *.vercel.app)
          const isAllowed = allowedOrigins.some(allowed => {
            if (allowed.includes('*')) {
              const pattern = allowed.replace(/\*/g, '.*');
              const regex = new RegExp(`^${pattern}$`);
              return regex.test(origin);
            }
            return false;
          });
          
          if (isAllowed) {
            callback(null, true);
          } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
          }
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
    });
    
    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    
    // Global prefix
    app.setGlobalPrefix('api');
    
    await app.init();
    cachedApp = app;
  }
  
  return cachedApp;
}

// For local development
if (require.main === module) {
  const port = process.env.PORT || 3000;
  bootstrap().then(app => {
    app.listen(port, () => {
      console.log(`🚀 Application is running on port ${port}`);
    });
  });
}

// Export for Vercel
export default async (req: any, res: any) => {
  const app = await bootstrap();
  const expressApp = app.getHttpAdapter().getInstance();
  return expressApp(req, res);
};