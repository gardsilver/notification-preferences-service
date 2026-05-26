/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/unbound-method */
import { of, throwError, firstValueFrom } from 'rxjs';
import { faker } from '@faker-js/faker';
import * as crypto from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, BadRequestException, ConflictException, CallHandler } from '@nestjs/common';
import { API_IDEMPOTENCY_SERVICE_TOKEN, ApiIdempotencyService } from 'src/core/repositories/postgres';
import { HttpHeaderNames } from '../types/constants';
import { IdempotencyInterceptor } from './idempotency.interceptor';

describe('IdempotencyInterceptor', () => {
  let interceptor: IdempotencyInterceptor;
  let mockService: jest.Mocked<ApiIdempotencyService>;

  let mockRequest: any;
  let mockResponse: any;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;

  let setHeaderSpy: jest.Mock;
  let sendSpy: jest.Mock;

  beforeEach(async () => {
    mockService = {
      findByPk: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
    } as unknown as jest.Mocked<ApiIdempotencyService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotencyInterceptor,
        {
          provide: API_IDEMPOTENCY_SERVICE_TOKEN,
          useValue: mockService,
        },
      ],
    }).compile();

    interceptor = module.get<IdempotencyInterceptor>(IdempotencyInterceptor);

    setHeaderSpy = jest.fn().mockReturnThis();
    sendSpy = jest.fn().mockReturnThis();

    mockRequest = {
      headers: {},
      body: {},
    };

    mockResponse = {
      statusCode: 200,
      setHeader: setHeaderSpy,
      send: sendSpy,
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as jest.Mocked<ExecutionContext>;

    mockCallHandler = {
      handle: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should skip interception if idempotency key header is missing', async () => {
    mockCallHandler.handle.mockReturnValue(of({ success: true }));

    const result$ = await interceptor.intercept(mockExecutionContext, mockCallHandler);
    const result = await firstValueFrom(result$);

    expect(mockService.findByPk).not.toHaveBeenCalled();
    expect(mockCallHandler.handle).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true });
  });

  it('should throw BadRequestException if request body does not match the cached hash', async () => {
    const key = faker.string.uuid();
    mockRequest.headers[HttpHeaderNames.IDEMPOTENCY_KEY] = key;
    mockRequest.body = { current: 'data' };

    mockService.findByPk.mockResolvedValue({
      id: key,
      createdAt: new Date(),
      requestHash: 'different-hash',
      responseCode: 200,
      responseBody: {},
    });

    await expect(interceptor.intercept(mockExecutionContext, mockCallHandler)).rejects.toThrow(BadRequestException);
    expect(mockCallHandler.handle).not.toHaveBeenCalled();
  });

  it('should throw ConflictException if previous request is still in progress (code 0)', async () => {
    const key = faker.string.uuid();
    const expectedHash = crypto.createHash('sha256').update(JSON.stringify({})).digest('hex');

    mockRequest.headers[HttpHeaderNames.IDEMPOTENCY_KEY] = key;

    mockService.findByPk.mockResolvedValue({
      id: key,
      createdAt: new Date(),
      requestHash: expectedHash,
      responseCode: 0,
      responseBody: {},
    });

    await expect(interceptor.intercept(mockExecutionContext, mockCallHandler)).rejects.toThrow(ConflictException);
    expect(mockCallHandler.handle).not.toHaveBeenCalled();
  });

  describe('Inbound Repeat (HIT) Scenarios', () => {
    let expectedHash: string;

    beforeEach(() => {
      expectedHash = crypto.createHash('sha256').update(JSON.stringify({})).digest('hex');
    });

    it('should correctly repeat a valid JSON object response', async () => {
      const key = faker.string.uuid();
      const cachedBody = { success: true, data: faker.word.sample() };
      mockRequest.headers[HttpHeaderNames.IDEMPOTENCY_KEY] = key;

      mockService.findByPk.mockResolvedValue({
        id: key,
        createdAt: new Date(),
        requestHash: expectedHash,
        responseCode: 200,
        responseBody: cachedBody,
      });

      const result$ = await interceptor.intercept(mockExecutionContext, mockCallHandler);
      const result = await firstValueFrom(result$);

      expect(mockService.findByPk).toHaveBeenCalledWith(key);
      expect(mockResponse.statusCode).toBe(200);
      expect(setHeaderSpy).toHaveBeenCalledWith('X-Cache-Idempotency', 'HIT');
      expect(mockCallHandler.handle).not.toHaveBeenCalled();

      mockResponse.send(cachedBody);
      expect(sendSpy).toHaveBeenCalledWith(cachedBody);
      expect(result).toEqual(cachedBody);
    });

    it('should correctly repeat a string primitive response using proxy response.send', async () => {
      const key = faker.string.uuid();
      const cachedString = 'Hello World!';
      mockRequest.headers[HttpHeaderNames.IDEMPOTENCY_KEY] = key;

      mockService.findByPk.mockResolvedValue({
        id: key,
        createdAt: new Date(),
        requestHash: expectedHash,
        responseCode: 200,
        responseBody: cachedString as any,
      });

      const result$ = await interceptor.intercept(mockExecutionContext, mockCallHandler);
      const result = await firstValueFrom(result$);

      expect(mockResponse.statusCode).toBe(200);
      expect(setHeaderSpy).toHaveBeenCalledWith('X-Cache-Idempotency', 'HIT');

      mockResponse.send(undefined);

      expect(sendSpy).toHaveBeenCalledWith(cachedString);
      expect(result).toBe(cachedString);
    });

    it('should correctly handle and repeat an empty response (e.g. 204 No Content)', async () => {
      const key = faker.string.uuid();
      mockRequest.headers[HttpHeaderNames.IDEMPOTENCY_KEY] = key;

      mockService.findByPk.mockResolvedValue({
        id: key,
        createdAt: new Date(),
        requestHash: expectedHash,
        responseCode: 204,
        responseBody: {} as any,
      });

      const result$ = await interceptor.intercept(mockExecutionContext, mockCallHandler);
      const result = await firstValueFrom(result$);

      expect(mockResponse.statusCode).toBe(204);
      expect(setHeaderSpy).toHaveBeenCalledWith('X-Cache-Idempotency', 'HIT');

      mockResponse.send({});
      expect(sendSpy).toHaveBeenCalledWith({});
      expect(result).toEqual({});
    });
  });

  describe('Outbound Pipeline (MISS) Scenarios', () => {
    it('should create initial record and update it after successful controller execution', async () => {
      const key = faker.string.uuid();
      const controllerResponse = { saved: true };
      mockRequest.headers[HttpHeaderNames.IDEMPOTENCY_KEY] = key;
      mockResponse.statusCode = 200;

      mockService.findByPk.mockResolvedValue(null);
      mockService.create.mockResolvedValue({} as any);
      mockService.update.mockResolvedValue([1]); // 👈 Передан аргумент [1] для соответствия типам Sequelize
      mockCallHandler.handle.mockReturnValue(of(controllerResponse));

      const result$ = await interceptor.intercept(mockExecutionContext, mockCallHandler);
      const result = await firstValueFrom(result$);

      expect(mockService.create).toHaveBeenCalledWith({
        id: key,
        requestHash: expect.any(String),
        responseCode: 0,
        responseBody: {},
      });
      expect(mockCallHandler.handle).toHaveBeenCalledTimes(1);
      expect(mockService.update).toHaveBeenCalledWith(key, {
        responseCode: 200,
        responseBody: controllerResponse,
      });
      expect(result).toEqual(controllerResponse);
    });

    it('should remove idempotency record if controller throws an error', async () => {
      const key = faker.string.uuid();
      mockRequest.headers[HttpHeaderNames.IDEMPOTENCY_KEY] = key;

      mockService.findByPk.mockResolvedValue(null);
      mockService.create.mockResolvedValue({} as any);
      mockService.destroy.mockResolvedValue(1);

      const controllerError = new Error('Database down');
      mockCallHandler.handle.mockReturnValue(throwError(() => controllerError));

      const result$ = await interceptor.intercept(mockExecutionContext, mockCallHandler);

      await expect(firstValueFrom(result$)).rejects.toThrow('Database down');
      expect(mockService.destroy).toHaveBeenCalledWith(key);
    });
  });
});
