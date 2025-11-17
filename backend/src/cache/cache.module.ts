import { Module } from "@nestjs/common";
import { CacheModule as NestCacheModule } from "@nestjs/cache-manager";
import { CacheService } from "./cache.service";

@Module({
  imports: [
    NestCacheModule.register({
      ttl: 900, // 15 minutes default (in seconds)
      max: 100, // Maximum number of items in cache
      isGlobal: true, // Make cache available globally
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, NestCacheModule],
})
export class CacheModule {}
