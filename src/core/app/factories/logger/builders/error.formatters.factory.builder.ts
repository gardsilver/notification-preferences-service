import { DataBaseErrorFormatter } from 'src/modules/database';
import { AxiosErrorFormatter, HttpClientErrorFormatter } from 'src/modules/http/http-client';
import { HttpExceptionFormatter } from 'src/modules/http/http-server';
import { RedisClientErrorFormatter } from 'src/modules/redis-cache-manager';
import { ErrorFormattersFactory } from '../error.formatters.factory';

export abstract class ErrorFormattersFactoryBuilder {
  public static build(): ErrorFormattersFactory {
    return new ErrorFormattersFactory(
      new DataBaseErrorFormatter(),
      new AxiosErrorFormatter(),
      new HttpClientErrorFormatter(),
      new HttpExceptionFormatter(),
      new RedisClientErrorFormatter(),
    );
  }
}
