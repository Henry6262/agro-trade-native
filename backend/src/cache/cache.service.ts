import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: RedisClientType;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    this.client = createClient({
      url: redisUrl,
      retryDelayOnFailover: 100,
      enableAutoPipelining: true,
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis Client Connected');
    });

    this.client.on('ready', () => {
      this.logger.log('Redis Client Ready');
    });
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.disconnect();
  }

  // Basic key-value operations
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key}:`, error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hGet(key, field);
    } catch (error) {
      this.logger.error(`Error getting hash field ${field} from key ${key}:`, error);
      return null;
    }
  }

  async hset(key: string, field: string, value: any): Promise<void> {
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.hSet(key, field, serializedValue);
    } catch (error) {
      this.logger.error(`Error setting hash field ${field} in key ${key}:`, error);
    }
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    try {
      return await this.client.hGetAll(key);
    } catch (error) {
      this.logger.error(`Error getting all hash fields from key ${key}:`, error);
      return null;
    }
  }

  async hdel(key: string, field: string): Promise<void> {
    try {
      await this.client.hDel(key, field);
    } catch (error) {
      this.logger.error(`Error deleting hash field ${field} from key ${key}:`, error);
    }
  }

  // List operations
  async lpush(key: string, ...values: any[]): Promise<number> {
    try {
      const serializedValues = values.map(v => 
        typeof v === 'string' ? v : JSON.stringify(v)
      );
      return await this.client.lPush(key, serializedValues);
    } catch (error) {
      this.logger.error(`Error pushing to list ${key}:`, error);
      return 0;
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      return await this.client.rPop(key);
    } catch (error) {
      this.logger.error(`Error popping from list ${key}:`, error);
      return null;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.lRange(key, start, stop);
    } catch (error) {
      this.logger.error(`Error getting range from list ${key}:`, error);
      return [];
    }
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.sAdd(key, members);
    } catch (error) {
      this.logger.error(`Error adding to set ${key}:`, error);
      return 0;
    }
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.sRem(key, members);
    } catch (error) {
      this.logger.error(`Error removing from set ${key}:`, error);
      return 0;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.client.sMembers(key);
    } catch (error) {
      this.logger.error(`Error getting members from set ${key}:`, error);
      return [];
    }
  }

  async sismember(key: string, member: string): Promise<boolean> {
    try {
      return await this.client.sIsMember(key, member);
    } catch (error) {
      this.logger.error(`Error checking membership in set ${key}:`, error);
      return false;
    }
  }

  // Application-specific cache methods
  async cacheUser(userId: string, user: any, ttl: number = 3600): Promise<void> {
    await this.set(`user:${userId}`, user, ttl);
  }

  async getCachedUser(userId: string): Promise<any> {
    return await this.get(`user:${userId}`);
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await this.del(`user:${userId}`);
  }

  async cacheOrder(orderId: string, order: any, ttl: number = 1800): Promise<void> {
    await this.set(`order:${orderId}`, order, ttl);
  }

  async getCachedOrder(orderId: string): Promise<any> {
    return await this.get(`order:${orderId}`);
  }

  async invalidateOrderCache(orderId: string): Promise<void> {
    await this.del(`order:${orderId}`);
  }

  // Session management
  async setUserSession(userId: string, sessionData: any, ttl: number = 86400): Promise<void> {
    await this.set(`session:${userId}`, sessionData, ttl);
  }

  async getUserSession(userId: string): Promise<any> {
    return await this.get(`session:${userId}`);
  }

  async invalidateUserSession(userId: string): Promise<void> {
    await this.del(`session:${userId}`);
  }

  // Rate limiting
  async incrementRateLimit(key: string, window: number): Promise<number> {
    try {
      const multi = this.client.multi();
      multi.incr(key);
      multi.expire(key, window);
      const results = await multi.exec();
      return results[0] as number;
    } catch (error) {
      this.logger.error(`Error incrementing rate limit for key ${key}:`, error);
      return 0;
    }
  }

  async getRateLimit(key: string): Promise<number> {
    try {
      const value = await this.client.get(key);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      this.logger.error(`Error getting rate limit for key ${key}:`, error);
      return 0;
    }
  }

  // Pub/Sub for real-time features
  async publish(channel: string, message: any): Promise<number> {
    try {
      const serializedMessage = typeof message === 'string' ? message : JSON.stringify(message);
      return await this.client.publish(channel, serializedMessage);
    } catch (error) {
      this.logger.error(`Error publishing to channel ${channel}:`, error);
      return 0;
    }
  }

  // Utility methods
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      this.logger.error(`Error getting keys with pattern ${pattern}:`, error);
      return [];
    }
  }

  async flushdb(): Promise<void> {
    try {
      await this.client.flushDb();
      this.logger.log('Redis database flushed');
    } catch (error) {
      this.logger.error('Error flushing Redis database:', error);
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const response = await this.client.ping();
      return response === 'PONG';
    } catch (error) {
      this.logger.error('Redis ping failed:', error);
      return false;
    }
  }
}