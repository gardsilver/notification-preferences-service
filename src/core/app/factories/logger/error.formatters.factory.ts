import { Injectable } from '@nestjs/common';
import { BaseErrorObjectFormatter } from 'src/modules/elk-logger';
import { DataBaseErrorFormatter } from 'src/modules/database';
import { AxiosErrorFormatter, HttpClientErrorFormatter } from 'src/modules/http/http-client';
import { HttpExceptionFormatter } from 'src/modules/http/http-server';
import { RedisClientErrorFormatter } from 'src/modules/redis-cache-manager';

@Injectable()
export class ErrorFormattersFactory {
  constructor(
    protected readonly dataBaseErrorFormatter: DataBaseErrorFormatter,
    protected readonly axiosErrorFormatter: AxiosErrorFormatter,
    protected readonly httpClientErrorFormatter: HttpClientErrorFormatter,
    protected readonly httpExceptionFormatter: HttpExceptionFormatter,
    protected readonly redisClientErrorFormatter: RedisClientErrorFormatter,
  ) {}

  getFormatters(): BaseErrorObjectFormatter[] {
    return [
      this.dataBaseErrorFormatter,
      this.axiosErrorFormatter,
      this.httpClientErrorFormatter,
      this.httpExceptionFormatter,
      this.redisClientErrorFormatter,
    ];
  }
}
