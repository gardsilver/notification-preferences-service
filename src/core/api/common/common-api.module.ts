import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PostgresModule } from 'src/core/repositories/postgres';
import { ElkLoggerModule } from 'src/modules/elk-logger';
import { PrometheusModule } from 'src/modules/prometheus';
import { RedisCacheManagerModule } from 'src/modules/redis-cache-manager';
import { IdempotencyInterceptor } from './interceptors/idempotency.interceptor';

@Module({
  imports: [ConfigModule, ElkLoggerModule, PrometheusModule, RedisCacheManagerModule, PostgresModule],
  providers: [IdempotencyInterceptor],
  exports: [IdempotencyInterceptor],
})
export class CommonApiModule {}
