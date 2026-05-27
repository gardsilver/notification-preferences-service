/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { GeneralAsyncContext, SKIP_INTERCEPTORS_KEY } from 'src/modules/common';
import { ChannelType, NotificationType } from 'src/core/repositories/postgres';
import { IdempotencyInterceptor } from 'src/core/api/common';
import { ResponseStatus } from '../dto/base.dto';
import { PersonalCheckSendNotificationRequestDto } from '../dto/personal-check-send-notification.dto';
import { HttpApiPersonNotificationController } from './person-notification.controller';

describe('HttpApiPersonNotificationController', () => {
  let controller: HttpApiPersonNotificationController;

  let service: {
    checkSend: jest.Mock;
  };

  beforeEach(() => {
    service = {
      checkSend: jest.fn(),
    };

    controller = new HttpApiPersonNotificationController(service as any);
  });

  describe('checkSend', () => {
    const dto: PersonalCheckSendNotificationRequestDto = {
      personId: '00000000-0000-0000-0000-000000000000',
      notificationType: NotificationType.MARKETING,
      channelType: ChannelType.EMAIL,
      regionCode: 'RU',
      datetime: '2026-05-21T21:30:00Z',
    };

    const asyncContext = {
      traceId: 'trace-id',
      spanId: 'span-id',
    };

    it('should call service.checkSend with dto', async () => {
      service.checkSend.mockResolvedValue({
        status: ResponseStatus.ALLOW,
        data: {
          channelIds: ['channel-1'],
        },
      });

      const runWithContextAsyncSpy = jest
        .spyOn(GeneralAsyncContext.instance, 'runWithContextAsync')
        .mockImplementation(async (callback: any) => callback());

      await controller.checkSend(dto, asyncContext as any);

      expect(service.checkSend).toHaveBeenCalledWith(dto);

      expect(runWithContextAsyncSpy).toHaveBeenCalledTimes(1);
    });

    it('should return service response', async () => {
      const response = {
        status: ResponseStatus.ALLOW,
        data: {
          channelIds: ['channel-1', 'channel-2'],
        },
      };

      service.checkSend.mockResolvedValue(response);

      jest
        .spyOn(GeneralAsyncContext.instance, 'runWithContextAsync')
        .mockImplementation(async (callback: any) => callback());

      const result = await controller.checkSend(dto, asyncContext as any);

      expect(result).toEqual(response);
    });

    it('should execute service inside async context callback', async () => {
      service.checkSend.mockResolvedValue({
        status: ResponseStatus.ALLOW,
      });

      let callbackExecuted = false;

      jest.spyOn(GeneralAsyncContext.instance, 'runWithContextAsync').mockImplementation(async (callback: any) => {
        callbackExecuted = true;

        return callback();
      });

      await controller.checkSend(dto, asyncContext as any);

      expect(callbackExecuted).toBe(true);
      expect(service.checkSend).toHaveBeenCalledWith(dto);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Service failed');

      service.checkSend.mockRejectedValue(error);

      jest
        .spyOn(GeneralAsyncContext.instance, 'runWithContextAsync')
        .mockImplementation(async (callback: any) => callback());

      await expect(controller.checkSend(dto, asyncContext as any)).rejects.toThrow(error);
    });
  });

  describe('decorators', () => {
    it('should have SkipInterceptors metadata', () => {
      const metadata = Reflect.getMetadata(
        SKIP_INTERCEPTORS_KEY,
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        HttpApiPersonNotificationController.prototype.checkSend,
      );

      expect(metadata).toBeDefined();
      expect(Array.isArray(metadata)).toBe(true);
    });

    it('should skip IdempotencyInterceptor', () => {
      const metadata = Reflect.getMetadata(
        SKIP_INTERCEPTORS_KEY,
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        HttpApiPersonNotificationController.prototype.checkSend,
      );

      expect(metadata).toContain(IdempotencyInterceptor);
    });
  });
});
