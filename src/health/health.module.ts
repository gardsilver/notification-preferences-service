import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ElkLoggerModule } from 'src/modules/elk-logger';
import { PrometheusModule } from 'src/modules/prometheus';
import { AuthModule } from 'src/modules/auth';
import { GracefulShutdownModule } from 'src/modules/graceful-shutdown';
import { DatabaseModule } from 'src/modules/database';
import { RedisCacheManagerModule } from 'src/modules/redis-cache-manager';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [
    TerminusModule.forRoot(),
    ElkLoggerModule,
    PrometheusModule,
    AuthModule,
    DatabaseModule,
    RedisCacheManagerModule,
    GracefulShutdownModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {}
