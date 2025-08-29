import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

let cachedApp: NestExpressApplication;

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    
    // Enable CORS with multiple origins
    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests from localhost on any port
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:8081',
          'http://localhost:8082',
          'http://localhost:8083', // Expo web alternative port
          'http://localhost:19006', // Expo web
          process.env.CLIENT_URL,
          process.env.FRONTEND_URL,
        ].filter(Boolean);
        
        // In production, be more strict
        if (process.env.NODE_ENV === 'production') {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        } else {
          // In development, allow any origin
          callback(null, true);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
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