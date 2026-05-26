/* eslint-disable @typescript-eslint/no-explicit-any */

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { NotificationType, NotificationStatus } from '../types/types';
import { PersonChannelNotificationSettingsService } from './person-channel-notification-settings.service';
import { PersonChannelNotificationSettingsModel } from '../entities/person-channel-notification-settings.model';

const mockRepository = {
  update: jest.fn(),
  create: jest.fn(),
  findByPk: jest.fn(),
};

const mockChannel = {
  id: 'channel-id',
  $get: jest.fn(),
} as any;

const defaultOptions = [
  {
    type: NotificationType.SYSTEM,
    quietRanges: '{}',
  },
] as any;

describe('PersonChannelNotificationSettingsService', () => {
  let service: PersonChannelNotificationSettingsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonChannelNotificationSettingsService,
        {
          provide: getModelToken(PersonChannelNotificationSettingsModel),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get(PersonChannelNotificationSettingsService);
  });

  describe('saveList', () => {
    it('should return [] if no settings provided', async () => {
      const result = await service.saveList(mockChannel, [], defaultOptions);

      expect(result).toEqual([]);
    });

    it('should UPDATE existing setting', async () => {
      const existingSetting = {
        id: 'setting-1',
        type: NotificationType.SYSTEM,
      };

      mockChannel.$get.mockResolvedValue([existingSetting]);

      mockRepository.update.mockResolvedValue([1]);

      const updatedModel = {
        id: 'setting-1',
        type: NotificationType.SYSTEM,
        status: NotificationStatus.ACTIVE,
        get: jest.fn().mockReturnValue({
          id: 'setting-1',
          type: NotificationType.SYSTEM,
          status: NotificationStatus.ACTIVE,
        }),
      };

      mockRepository.findByPk.mockResolvedValue(updatedModel);

      const result = await service.saveList(
        mockChannel,
        [
          {
            type: NotificationType.SYSTEM,
            status: NotificationStatus.ACTIVE,
            quietRanges: {
              quietStart: 10,
              quietFinish: 20,
            },
          },
        ],
        defaultOptions,
      );

      expect(mockRepository.update).toHaveBeenCalled();
      expect(mockRepository.findByPk).toHaveBeenCalledWith('setting-1', expect.any(Object));

      expect(result.length).toBe(1);
      expect(result[0].type).toBe(NotificationType.SYSTEM);
    });

    it('should CREATE new setting when not exists', async () => {
      mockChannel.$get.mockResolvedValue([]); // no existing

      const createdModel = {
        id: 'new-setting',
        type: NotificationType.SYSTEM,
        get: jest.fn().mockReturnValue({
          id: 'new-setting',
          type: NotificationType.SYSTEM,
        }),
      };

      mockRepository.create.mockResolvedValue(createdModel);

      const result = await service.saveList(
        mockChannel,
        [
          {
            type: NotificationType.SYSTEM,
            status: NotificationStatus.ACTIVE,
            quietRanges: {
              quietStart: 5,
              quietFinish: 15,
            },
          },
        ],
        defaultOptions,
      );

      expect(mockRepository.create).toHaveBeenCalled();
      expect(result.length).toBe(1);
    });

    it('should use default quietRanges if not provided', async () => {
      mockChannel.$get.mockResolvedValue([]);

      const createdModel = {
        id: 'new-setting',
        type: NotificationType.SYSTEM,
        get: jest.fn().mockReturnValue({
          id: 'new-setting',
          type: NotificationType.SYSTEM,
        }),
      };

      mockRepository.create.mockResolvedValue(createdModel);

      await service.saveList(
        mockChannel,
        [
          {
            type: NotificationType.SYSTEM,
            status: NotificationStatus.ACTIVE,
          },
        ],
        [
          {
            type: NotificationType.SYSTEM,
            quietRanges: '{}',
          },
        ] as any,
      );

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          quietRanges: '{}',
        }),
        expect.any(Object),
      );
    });

    it('should skip unknown notification types', async () => {
      mockChannel.$get.mockResolvedValue([]);

      const result = await service.saveList(
        mockChannel,
        [
          {
            type: 'UNKNOWN' as any,
            status: NotificationStatus.ACTIVE,
          },
        ],
        defaultOptions,
      );

      expect(result).toEqual([]);
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });
});
