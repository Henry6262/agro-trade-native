import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        {
          emit: "event",
          level: "query",
        },
        {
          emit: "stdout",
          level: "error",
        },
        {
          emit: "stdout",
          level: "warn",
        },
      ],
    });

    // Log slow queries (> 100ms)
    this.$on("query" as never, (e: any) => {
      if (e.duration > 100) {
        this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
      } else if (e.duration > 50) {
        this.logger.debug(
          `Query took ${e.duration}ms: ${e.query.substring(0, 100)}...`,
        );
      }
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log("Database connected successfully");
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log("Database disconnected");
  }
}
