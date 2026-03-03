// Catch fatal errors BEFORE any module loads (e.g. native module crashes)
process.on("uncaughtException", (err) => {
  console.error("FATAL uncaughtException:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("FATAL unhandledRejection:", reason);
  process.exit(1);
});

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { setupSwagger } from "./swagger";

async function createApp() {
  console.log("Creating NestJS application...");
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ["error", "warn", "log"],
  });

  // Enable CORS with environment-based configuration
  const corsOrigins =
    process.env.CORS_ORIGINS?.split(",").map((origin) => origin.trim()) || [];
  const allowAllOrigins = process.env.CORS_ALLOW_ALL === "true";

  app.enableCors({
    origin: (origin, callback) => {
      // In development or if explicitly allowing all origins
      if (process.env.NODE_ENV !== "production" || allowAllOrigins) {
        callback(null, true);
        return;
      }

      // In production, check against allowed origins
      const allowedOrigins = [
        ...corsOrigins,
        // Always allow localhost for development
        "http://localhost:3000",
        "http://localhost:8081",
        "http://localhost:8082",
        "http://localhost:19006",
        // Android emulator
        "http://10.0.2.2:8081",
        "http://10.0.2.2:19006",
      ];

      // Check if origin is allowed
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Check for pattern matching (e.g., *.vercel.app)
        const isAllowed = allowedOrigins.some((allowed) => {
          if (allowed.includes("*")) {
            const pattern = allowed.replace(/\*/g, ".*");
            const regex = new RegExp(`^${pattern}$`);
            return regex.test(origin);
          }
          return false;
        });

        if (isAllowed) {
          callback(null, true);
        } else {
          console.warn(`CORS blocked origin: ${origin}`);
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
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
  app.setGlobalPrefix("api");

  if (process.env.ENABLE_SWAGGER !== "false") {
    setupSwagger(app);
  }

  return app;
}

async function bootstrap() {
  const app = await createApp();
  const port = process.env.PORT || 4000;

  // Listen on all interfaces (0.0.0.0) for Android emulator access
  await app.listen(port, "0.0.0.0");

  console.log(`🚀 Application is running on http://0.0.0.0:${port}`);
  console.log(`📱 Android emulator can access at http://10.0.2.2:${port}`);

  return app;
}

// Start the application
bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

// Export for Vercel (serverless)
let cachedApp: NestExpressApplication;
export default async (req: any, res: any) => {
  if (!cachedApp) {
    cachedApp = await createApp();
    await cachedApp.init();
  }
  const expressApp = cachedApp.getHttpAdapter().getInstance();
  return expressApp(req, res);
};
