/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpApiNotificationPolicyController } from './notification-policy.controller';
import { NotificationPolicyService } from '../services/notification-policy.service';
import { GeneralAsyncContext } from 'src/modules/common';
import { ResponseStatus } from '../dto/base.dto';
import { API_IDEMPOTENCY_SERVICE_TOKEN } from 'src/core/repositories/postgres';

describe('HttpApiNotificationPolicyController', () => {
  let controller: HttpApiNotificationPolicyController;

  // Изолированный мок прикладного сервиса
  const serviceMock = {
    create: jest.fn(),
    update: jest.fn(),
  };

  // Имитируем контекст асинхронного выполнения
  const mockAsyncContext = { traceId: 'test-trace-id' };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Заменяем поведение статического метода контекста, чтобы он просто выполнял колбэк
    jest
      .spyOn(GeneralAsyncContext.instance, 'runWithContextAsync')
      .mockImplementation(async (callback: () => any) => callback());

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HttpApiNotificationPolicyController],
      providers: [
        {
          provide: NotificationPolicyService,
          useValue: serviceMock,
        },
        // Добавляем мок для токена идемпотентности, чтобы IdempotencyInterceptor мог успешно инициализироваться
        {
          provide: API_IDEMPOTENCY_SERVICE_TOKEN,
          useValue: {
            findByPk: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(undefined),
            update: jest.fn().mockResolvedValue(undefined),
            destroy: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<HttpApiNotificationPolicyController>(HttpApiNotificationPolicyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPerson', () => {
    it('should run inside async context and return service create response', async () => {
      const mockDto: any = { type: 'EMAIL', channelType: 'email', regionCode: 'RU' };
      const mockResult = {
        status: ResponseStatus.SUCCESS,
        data: { id: 'policy-uuid-1', regionCode: 'RU' },
      };

      serviceMock.create.mockResolvedValue(mockResult);

      const result = await controller.createPerson(mockDto, mockAsyncContext as any);

      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      expect(GeneralAsyncContext.instance.runWithContextAsync).toHaveBeenCalledWith(
        expect.any(Function),
        mockAsyncContext,
      );
      expect(serviceMock.create).toHaveBeenCalledWith(mockDto);
      expect(result).toEqual(mockResult);
    });

    it('should forward service rejections', async () => {
      const mockDto: any = { type: 'EMAIL' };
      serviceMock.create.mockRejectedValue(new Error('Validation or DB Failure'));

      await expect(controller.createPerson(mockDto, mockAsyncContext as any)).rejects.toThrow(
        'Validation or DB Failure',
      );
    });
  });

  describe('updatePerson', () => {
    it('should run inside async context and return service update response', async () => {
      const mockDto: any = { id: 'policy-uuid-2', status: 1 };
      const mockResult = {
        status: ResponseStatus.SUCCESS,
        data: { id: 'policy-uuid-2', status: 1 },
      };

      serviceMock.update.mockResolvedValue(mockResult);

      const result = await controller.updatePerson(mockDto, mockAsyncContext as any);

      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      expect(GeneralAsyncContext.instance.runWithContextAsync).toHaveBeenCalledWith(
        expect.any(Function),
        mockAsyncContext,
      );
      expect(serviceMock.update).toHaveBeenCalledWith(mockDto);
      expect(result).toEqual(mockResult);
    });

    it('should forward service rejections on update', async () => {
      const mockDto: any = { id: 'policy-uuid-2' };
      serviceMock.update.mockRejectedValue(new Error('Record not found'));

      await expect(controller.updatePerson(mockDto, mockAsyncContext as any)).rejects.toThrow('Record not found');
    });
  });
});
