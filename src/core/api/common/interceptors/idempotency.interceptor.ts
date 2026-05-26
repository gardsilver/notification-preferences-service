/* eslint-disable @typescript-eslint/no-explicit-any */
import { Observable, of, throwError, from } from 'rxjs';
import { catchError, concatMap } from 'rxjs/operators';
import * as crypto from 'crypto';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { HttHeadersHelper } from 'src/modules/http/http-common';
import { API_IDEMPOTENCY_SERVICE_TOKEN, ApiIdempotencyService } from 'src/core/repositories/postgres';
import { HttpHeaderNames } from '../types/constants';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    @Inject(API_IDEMPOTENCY_SERVICE_TOKEN)
    private readonly apiIdempotencyService: ApiIdempotencyService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const headers = HttHeadersHelper.normalize(request.headers);

    const idempotencyKey = headers[HttpHeaderNames.IDEMPOTENCY_KEY];

    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      return next.handle();
    }

    const requestHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(request.body || {}))
      .digest('hex');

    const existingRecord = await this.apiIdempotencyService.findByPk(idempotencyKey);

    if (existingRecord) {
      if (existingRecord.requestHash !== requestHash) {
        throw new BadRequestException('Idempotency key rules violation: request body mismatch.');
      }

      if (existingRecord.responseCode === 0) {
        throw new ConflictException('Request with this idempotency key is already in progress.');
      }

      // 1. Устанавливаем метаданные ответа
      response.statusCode = existingRecord.responseCode;
      response.setHeader('X-Cache-Idempotency', 'HIT');

      // 2. Перехватываем финальную отправку ответа Express.
      // Это позволит всем остальным интерцепторам проекта (включая логирование и заголовки)
      // полностью выполнить свою работу, но когда Express попытается отправить пустой ответ,
      // мы подменим его тело на сохраненную строку из БД.
      const originalSend = response.send;
      response.send = function (body?: any) {
        // Если пайплайн проекта пытается отправить пустой ответ для строки, возвращаем данные из БД
        if (body === undefined || body === 'undefined' || body === '') {
          return originalSend.call(this, existingRecord.responseBody);
        }
        return originalSend.call(this, body);
      };

      // 3. Передаем управление дальше по цепочке интерцепторов
      return of(existingRecord.responseBody);
    }

    await this.apiIdempotencyService.create({
      id: idempotencyKey,
      requestHash,
      responseCode: 0,
      responseBody: {},
    });

    return next.handle().pipe(
      concatMap((body: unknown) => {
        const statusCode = response.statusCode || 200;

        return from(
          this.apiIdempotencyService.update(idempotencyKey, {
            responseCode: statusCode,
            responseBody: body as Record<string, unknown>,
          }),
        ).pipe(concatMap(() => of(body)));
      }),
      catchError((error: unknown) => {
        this.apiIdempotencyService.destroy(idempotencyKey).catch(() => {
          // Nothing
        });
        return throwError(() => error);
      }),
    );
  }
}
