import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElkLoggerModule } from 'src/modules/elk-logger';
import { RedisCacheManagerModule } from 'src/modules/redis-cache-manager';
import { PrometheusModule } from 'src/modules/prometheus';
import { AuthModule } from 'src/modules/auth';
import { GracefulShutdownModule } from 'src/modules/graceful-shutdown';
import { HttpServerModule } from 'src/modules/http/http-server';
import { HealthModule } from 'src/health';
import {
  AppModule,
  ErrorFormattersFactory,
  IgnoreObjectsFactory,
  ObjectFormattersFactory,
  FormattersFactory,
} from 'src/core/app';
import { CommonApiModule } from 'src/core/api/common';
import { HttpApiModule } from 'src/core/api/http';
import { PostgresModule } from 'src/core/repositories/postgres/postgres.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.env', '.default.env'], isGlobal: true, cache: true }),
    AppModule,
    ElkLoggerModule.forRoot({
      imports: [AppModule],
      formattersOptions: {
        sortFields: ['timestamp', 'level', 'module', 'message', 'traceId', 'payload'],
        ignoreObjects: {
          inject: [IgnoreObjectsFactory],
          useFactory: (ignoreObjectsFactory: IgnoreObjectsFactory) => ignoreObjectsFactory.getCheckObjects(),
        },
        exceptionFormatters: {
          inject: [ErrorFormattersFactory],
          useFactory: (errorFormattersFactory: ErrorFormattersFactory) => errorFormattersFactory.getFormatters(),
        },
        objectFormatters: {
          inject: [ObjectFormattersFactory],
          useFactory: (objectFormattersFactory: ObjectFormattersFactory) => objectFormattersFactory.getFormatters(),
        },
      },
      formatters: {
        inject: [FormattersFactory],
        useFactory: (formattersFactory: FormattersFactory) => {
          return formattersFactory.getFormatters();
        },
      },
    }),
    PrometheusModule,
    RedisCacheManagerModule.forRoot(),
    AuthModule.forRoot({
      useCertificate: '801c29c6-ed2f-4ae4-92fb-fafe914893c0',
    }),
    HttpServerModule.forRoot(),
    GracefulShutdownModule.forRoot(),
    PostgresModule,
    CommonApiModule,
    HealthModule,
    HttpApiModule,
  ],
})
export class MainModule {}
