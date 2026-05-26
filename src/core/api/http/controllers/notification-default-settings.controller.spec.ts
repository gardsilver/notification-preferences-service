/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpApiNotificationDefaultSettingsController } from './notification-default-settings.controller';
import { NotificationDefaultSettingsService } from '../services/notification-default-settings.service';
import {
  CreateNotificationDefaultSettingsRequestDto,
  UpdateNotificationDefaultSettingsRequestDto,
} from '../dto/notification-default-settings.dto';
import { API_IDEMPOTENCY_SERVICE_TOKEN } from 'src/core/repositories/postgres';

/*
  import { IdempotencyInterceptor } from 'src/core/api/common';

+

  const interceptorMock = {
    intercept: jest.fn((_, next) => next.handle()),
  };

+

  {
    provide: IdempotencyInterceptor,
    useValue: interceptorMock,
  },
*/

describe('HttpApiNotificationDefaultSettingsController', () => {
  let controller: HttpApiNotificationDefaultSettingsController;

  const serviceMock = {
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HttpApiNotificationDefaultSettingsController],
      providers: [
        {
          provide: NotificationDefaultSettingsService,
          useValue: serviceMock,
        },
        {
          provide: API_IDEMPOTENCY_SERVICE_TOKEN,
          useValue: {
            findByPk: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(HttpApiNotificationDefaultSettingsController);

    jest.clearAllMocks();
  });

  describe('createPerson', () => {
    it('should call service.create and return result', async () => {
      const dto: CreateNotificationDefaultSettingsRequestDto = {} as any;

      const expected = {
        data: { id: '1' },
      };

      serviceMock.create.mockResolvedValue(expected);

      const result = await controller.createPerson(dto, {} as any);

      expect(serviceMock.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('updatePerson', () => {
    it('should call service.update and return result', async () => {
      const dto: UpdateNotificationDefaultSettingsRequestDto = {} as any;

      const expected = {
        data: { id: '1' },
      };

      serviceMock.update.mockResolvedValue(expected);

      const result = await controller.updatePerson(dto, {} as any);

      expect(serviceMock.update).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });
});
