import { DataBaseErrorFormatter } from 'src/modules/database';
import { AxiosErrorFormatter, HttpClientErrorFormatter } from 'src/modules/http/http-client';
import { HttpExceptionFormatter } from 'src/modules/http/http-server';
import { RedisClientErrorFormatter } from 'src/modules/redis-cache-manager';
import { ErrorFormattersFactory } from '../error.formatters.factory';
import { ErrorFormattersFactoryBuilder } from './error.formatters.factory.builder';

describe(ErrorFormattersFactoryBuilder.name, () => {
  it('build', async () => {
    const service = ErrorFormattersFactoryBuilder.build();

    expect(service instanceof ErrorFormattersFactory).toBeTruthy();

    expect(service.getFormatters()).toEqual([
      new DataBaseErrorFormatter(),
      new AxiosErrorFormatter(),
      new HttpClientErrorFormatter(),
      new HttpExceptionFormatter(),
      new RedisClientErrorFormatter(),
    ]);
  });
});
