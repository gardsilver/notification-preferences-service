import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { DateTimestamp } from 'src/modules/date-timestamp';
import { DatetimeHelper } from 'src/core/app';
import {
  ChannelType,
  ICheckSendNotification,
  NotificationStatus,
  NotificationType,
  PersonChannelStatus,
} from '../types/types';
import { PersonModel } from '../entities/person.model';
import { PersonNotificationService } from './person-notification.service';
import { PersonChannelModel } from '../entities/person-channel.model';
import { PersonChannelNotificationSettingsModel } from '../entities/person-channel-notification-settings.model';

describe('PersonNotificationService', () => {
  let service: PersonNotificationService;

  let personRepository: {
    findOne: jest.Mock;
  };

  let channelRepository: {
    findAll: jest.Mock;
  };

  beforeEach(() => {
    personRepository = {
      findOne: jest.fn(),
    };

    channelRepository = {
      findAll: jest.fn(),
    };

    service = new PersonNotificationService(
      {} as Sequelize,
      personRepository as unknown as typeof PersonModel,
      channelRepository as unknown as typeof PersonChannelModel,
    );
  });

  describe('checkSend', () => {
    const payload: ICheckSendNotification = {
      personId: 'person-1',
      notificationType: NotificationType.MARKETING,
      channelType: ChannelType.EMAIL,
      datetime: new DateTimestamp('2024-01-01 12:00:00'),
    };

    it('should return false when person not found', async () => {
      personRepository.findOne.mockResolvedValue(null);

      const result = await service.checkSend(payload);

      expect(result).toEqual({
        status: false,
        reason: 'Person not found',
      });

      expect(personRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: payload.personId,
        },
        attributes: ['id', 'timezone', 'regionCode'],
      });
    });

    it('should return false when person not found in region', async () => {
      personRepository.findOne.mockResolvedValue(null);

      const result = await service.checkSend({
        ...payload,
        regionCode: 'RU',
      });

      expect(result).toEqual({
        status: false,
        reason: 'Person not found for region',
      });

      expect(personRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: payload.personId,
          regionCode: 'RU',
        },
        attributes: ['id', 'timezone', 'regionCode'],
      });
    });

    it('should return false when no available channels', async () => {
      personRepository.findOne.mockResolvedValue({
        id: 'person-1',
        timezone: 'Europe/Moscow',
        regionCode: 'RU',
      });

      channelRepository.findAll.mockResolvedValue([]);

      jest.spyOn(DatetimeHelper, 'datetimeToLocalMinuteOfDay').mockReturnValue(720);

      const result = await service.checkSend(payload);

      expect(result).toEqual({
        status: false,
        reason: 'No available channels',
      });

      expect(channelRepository.findAll).toHaveBeenCalledWith({
        where: {
          personId: 'person-1',
          type: ChannelType.EMAIL,
          status: PersonChannelStatus.ACTIVE,
          isVerified: true,
        },
        attributes: ['id'],
        include: [
          {
            model: PersonChannelNotificationSettingsModel,
            required: true,
            attributes: ['id', 'quietRanges'],
            where: {
              type: NotificationType.MARKETING,
              status: NotificationStatus.ACTIVE,
              [Op.and]: expect.anything(),
            },
          },
        ],
      });
    });

    it('should return available channel ids', async () => {
      personRepository.findOne.mockResolvedValue({
        id: 'person-1',
        timezone: 'Europe/Moscow',
        regionCode: 'RU',
      });

      channelRepository.findAll.mockResolvedValue([
        {
          id: 'channel-1',
        },
        {
          id: 'channel-2',
        },
      ]);

      jest.spyOn(DatetimeHelper, 'datetimeToLocalMinuteOfDay').mockReturnValue(720);

      const result = await service.checkSend(payload);

      expect(result).toEqual({
        status: true,
        channelIds: ['channel-1', 'channel-2'],
      });
    });

    it('should calculate minute of day using person timezone', async () => {
      personRepository.findOne.mockResolvedValue({
        id: 'person-1',
        timezone: 'Europe/Berlin',
        regionCode: 'DE',
      });

      channelRepository.findAll.mockResolvedValue([
        {
          id: 'channel-1',
        },
      ]);

      const datetimeSpy = jest.spyOn(DatetimeHelper, 'datetimeToLocalMinuteOfDay').mockReturnValue(600);

      await service.checkSend(payload);

      expect(datetimeSpy).toHaveBeenCalledWith(payload.datetime, 'Europe/Berlin');
    });

    it('should query only verified active channels', async () => {
      personRepository.findOne.mockResolvedValue({
        id: 'person-1',
        timezone: 'UTC',
        regionCode: 'US',
      });

      channelRepository.findAll.mockResolvedValue([]);

      jest.spyOn(DatetimeHelper, 'datetimeToLocalMinuteOfDay').mockReturnValue(100);

      await service.checkSend(payload);

      expect(channelRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            personId: 'person-1',
            type: ChannelType.EMAIL,
            status: PersonChannelStatus.ACTIVE,
            isVerified: true,
          },
        }),
      );
    });
  });
});
