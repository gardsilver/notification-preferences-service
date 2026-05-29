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
import { NotificationPolicyModel } from '../entities/notification-policy.model';

describe('PersonNotificationService', () => {
  let service: PersonNotificationService;

  let personRepository: {
    findOne: jest.Mock;
  };

  let channelRepository: {
    findAll: jest.Mock;
  };

  let policyRepository: {
    findOne: jest.Mock;
  };

  beforeEach(() => {
    personRepository = {
      findOne: jest.fn(),
    };

    channelRepository = {
      findAll: jest.fn(),
    };

    policyRepository = {
      findOne: jest.fn(),
    };

    service = new PersonNotificationService(
      {} as Sequelize,
      personRepository as unknown as typeof PersonModel,
      policyRepository as unknown as typeof NotificationPolicyModel,
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

    it('should return false when blocked by global notification policy', async () => {
      personRepository.findOne.mockResolvedValue({
        id: 'person-1',
        timezone: 'Europe/Moscow',
        regionCode: 'RU',
      });

      // Имитируем, что глобальная политика существует и она отключена (DISABLED)
      policyRepository.findOne.mockResolvedValue({
        status: NotificationStatus.DISABLED,
      });

      const result = await service.checkSend(payload);

      expect(result).toEqual({
        status: false,
        reason: 'Blocked by global notification policy',
      });

      expect(policyRepository.findOne).toHaveBeenCalledWith({
        where: {
          notificationType: payload.notificationType,
          channelType: payload.channelType,
          regionCode: 'RU',
        },
        attributes: ['status'],
      });

      // Проверяем, что до поиска каналов выполнение не дошло (экономия ресурсов)
      expect(channelRepository.findAll).not.toHaveBeenCalled();
    });

    it('should return false when no available channels and global policy is active', async () => {
      personRepository.findOne.mockResolvedValue({
        id: 'person-1',
        timezone: 'Europe/Moscow',
        regionCode: 'RU',
      });

      // Имитируем, что глобальная политика включена (ACTIVE)
      policyRepository.findOne.mockResolvedValue({
        status: NotificationStatus.ACTIVE,
      });

      channelRepository.findAll.mockResolvedValue([]);

      jest.spyOn(DatetimeHelper, 'datetimeToLocalMinuteOfDay').mockReturnValue(720);

      const result = await service.checkSend(payload);

      expect(result).toEqual({
        status: false,
        reason: 'No available channels',
      });

      expect(policyRepository.findOne).toHaveBeenCalled();
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

    it('should return available channel ids when global policy does not exist', async () => {
      personRepository.findOne.mockResolvedValue({
        id: 'person-1',
        timezone: 'Europe/Moscow',
        regionCode: 'RU',
      });

      // Имитируем отсутствие записи политики в БД (по умолчанию разрешено)
      policyRepository.findOne.mockResolvedValue(null);

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

    it('should calculate minute of day using person timezone if policy is active', async () => {
      personRepository.findOne.mockResolvedValue({
        id: 'person-1',
        timezone: 'Europe/Berlin',
        regionCode: 'DE',
      });

      policyRepository.findOne.mockResolvedValue({
        status: NotificationStatus.ACTIVE,
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

    it('should query only verified active channels if policy is active', async () => {
      personRepository.findOne.mockResolvedValue({
        id: 'person-1',
        timezone: 'UTC',
        regionCode: 'US',
      });

      policyRepository.findOne.mockResolvedValue(null);
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
