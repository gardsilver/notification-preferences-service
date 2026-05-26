import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BufferObjectFormatter } from 'src/modules/common/formatters';
import { DataBaseErrorFormatter, ValidationErrorItemObjectFormatter } from 'src/modules/database';
import { AxiosErrorFormatter, HttpClientErrorFormatter } from 'src/modules/http/http-client';
import { HttpSecurityHeadersFormatter } from 'src/modules/http/http-common';
import { HttpExceptionFormatter } from 'src/modules/http/http-server';
import { RedisClientErrorFormatter } from 'src/modules/redis-cache-manager';
import { AppConfig } from './services/app.config';
import { ErrorFormattersFactory } from './factories/logger/error.formatters.factory';
import { ObjectFormattersFactory } from './factories/logger/object.formatters.factory';
import { IgnoreObjectsFactory } from './factories/logger/ignore-objects.factory';
import { FormattersFactory } from './factories/logger/formatters.factory';

@Module({
  imports: [ConfigModule],
  providers: [
    AppConfig,
    IgnoreObjectsFactory,
    BufferObjectFormatter,
    DataBaseErrorFormatter,
    AxiosErrorFormatter,
    HttpClientErrorFormatter,
    HttpExceptionFormatter,
    RedisClientErrorFormatter,
    ErrorFormattersFactory,
    ValidationErrorItemObjectFormatter,
    ObjectFormattersFactory,
    HttpSecurityHeadersFormatter,
    FormattersFactory,
  ],
  exports: [AppConfig, IgnoreObjectsFactory, ErrorFormattersFactory, ObjectFormattersFactory, FormattersFactory],
})
export class AppModule {}
