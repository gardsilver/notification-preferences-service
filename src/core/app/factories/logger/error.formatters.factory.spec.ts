import { Test } from '@nestjs/testing';
import { DataBaseErrorFormatter } from 'src/modules/database';
import { AxiosErrorFormatter, HttpClientErrorFormatter } from 'src/modules/http/http-client';
import { HttpExceptionFormatter } from 'src/modules/http/http-server';
import { RedisClientErrorFormatter } from 'src/modules/redis-cache-manager';
import { ErrorFormattersFactory } from './error.formatters.factory';

describe(ErrorFormattersFactory.name, () => {
  let service: ErrorFormattersFactory;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DataBaseErrorFormatter,
        AxiosErrorFormatter,
        HttpClientErrorFormatter,
        HttpExceptionFormatter,
        RedisClientErrorFormatter,
        ErrorFormattersFactory,
      ],
    }).compile();
    service = module.get(ErrorFormattersFactory);
  });

  it('init', async () => {
    expect(service).toBeDefined();
  });

  it('getFormatters', async () => {
    const formatters = service.getFormatters();
    expect(formatters).toEqual([
      new DataBaseErrorFormatter(),
      new AxiosErrorFormatter(),
      new HttpClientErrorFormatter(),
      new HttpExceptionFormatter(),
      new RedisClientErrorFormatter(),
    ]);
  });
});
