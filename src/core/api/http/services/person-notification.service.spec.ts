/* eslint-disable @typescript-eslint/no-explicit-any */
import { InternalServerErrorException } from '@nestjs/common';
import { DateTimestamp } from 'src/modules/date-timestamp';
import { ChannelType, NotificationType } from 'src/core/repositories/postgres';
import { PersonNotificationService } from './person-notification.service';
import { PersonalCheckSendNotificationRequestDto } from '../dto/personal-check-send-notification.dto';
import { ResponseStatus } from '../dto/base.dto';

describe('PersonNotificationService', () => {
  let service: PersonNotificationService;

  let repositoryService: {
    checkSend: jest.Mock;
  };

  beforeEach(() => {
    repositoryService = {
      checkSend: jest.fn(),
    };

    service = new PersonNotificationService(repositoryService as any);
  });

  describe('checkSend', () => {
    const dto: PersonalCheckSendNotificationRequestDto = {
      personId: '00000000-0000-0000-0000-000000000000',
      notificationType: NotificationType.MARKETING,
      channelType: ChannelType.EMAIL,
      regionCode: 'RU',
      datetime: '2026-05-21T21:30:00Z',
    };

    it('should return ALLOW response with channel ids', async () => {
      repositoryService.checkSend.mockResolvedValue({
        status: true,
        channelIds: ['channel-1', 'channel-2'],
      });

      const result = await service.checkSend(dto);

      expect(result).toEqual({
        status: ResponseStatus.ALLOW,
        details: undefined,
        data: {
          channelIds: ['channel-1', 'channel-2'],
        },
      });
    });

    it('should return DENY response with reason', async () => {
      repositoryService.checkSend.mockResolvedValue({
        status: false,
        reason: 'No available channels',
      });

      const result = await service.checkSend(dto);

      expect(result).toEqual({
        status: ResponseStatus.DENY,
        details: 'No available channels',
        data: undefined,
      });
    });

    it('should map dto to repository payload', async () => {
      repositoryService.checkSend.mockResolvedValue({
        status: true,
        channelIds: ['channel-1'],
      });

      await service.checkSend(dto);

      expect(repositoryService.checkSend).toHaveBeenCalledTimes(1);

      const payload = repositoryService.checkSend.mock.calls[0][0];

      expect(payload).toMatchObject({
        personId: dto.personId,
        notificationType: dto.notificationType,
        channelType: dto.channelType,
        regionCode: dto.regionCode,
      });

      expect(payload.datetime).toBeInstanceOf(DateTimestamp);

      expect(payload.datetime.format()).toBe('2026-05-21T21:30:00+00:00');
    });

    it('should work without regionCode', async () => {
      repositoryService.checkSend.mockResolvedValue({
        status: true,
        channelIds: ['channel-1'],
      });

      const result = await service.checkSend({
        ...dto,
        regionCode: undefined,
      });

      expect(result.status).toBe(ResponseStatus.ALLOW);

      const payload = repositoryService.checkSend.mock.calls[0][0];

      expect(payload.regionCode).toBeUndefined();
    });

    it('should throw InternalServerErrorException on repository error', async () => {
      repositoryService.checkSend.mockRejectedValue(new Error('Database failed'));

      await expect(service.checkSend(dto)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw formatted InternalServerErrorException', async () => {
      repositoryService.checkSend.mockRejectedValue(new Error('Database failed'));

      try {
        await service.checkSend(dto);
      } catch (error: any) {
        expect(error.response).toEqual({
          status: ResponseStatus.ERROR,
          details: 'Internal database error.',
        });
      }
    });

    it('should create DateTimestamp from dto datetime', async () => {
      repositoryService.checkSend.mockResolvedValue({
        status: true,
        channelIds: ['channel-1'],
      });

      await service.checkSend(dto);

      const payload = repositoryService.checkSend.mock.calls[0][0];

      expect(payload.datetime.getTimestamp()).toBe(new Date('2026-05-21T21:30:00Z').getTime());
    });
  });
});
