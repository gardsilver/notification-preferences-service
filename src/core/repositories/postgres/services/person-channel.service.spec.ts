/* eslint-disable @typescript-eslint/no-explicit-any */
import { faker } from '@faker-js/faker';
import { ChannelType, NotificationStatus, NotificationType } from '../types/types';
import { PersonChannelService } from './person-channel.service';

describe('PersonChannelService', () => {
  let service: PersonChannelService;

  let repositoryMock: any;
  let cacheMock: any;
  let notificationDefaultSettingsServiceMock: any;
  let channelNotificationSettingsServiceMock: any;

  beforeEach(() => {
    repositoryMock = {
      findByPk: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    cacheMock = {
      get: jest.fn(),
      set: jest.fn(),
    };

    notificationDefaultSettingsServiceMock = {
      findAll: jest.fn().mockResolvedValue([]),
    };

    channelNotificationSettingsServiceMock = {
      saveList: jest.fn().mockResolvedValue([]),
    };

    service = new PersonChannelService(
      repositoryMock,
      notificationDefaultSettingsServiceMock,
      channelNotificationSettingsServiceMock,
      cacheMock,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isExist', () => {
    it('should return cached value if exists', async () => {
      cacheMock.get.mockResolvedValue({ exists: true });

      const result = await service.isExist(ChannelType.EMAIL, 'test@mail.com');

      expect(result).toBe(true);
      expect(repositoryMock.count).not.toHaveBeenCalled();
    });

    it('should return false when same value as current (excludeId)', async () => {
      repositoryMock.findByPk.mockResolvedValue({
        get: () => ({
          id: '1',
          type: ChannelType.EMAIL,
          value: 'test@mail.com',
        }),
      });

      const result = await service.isExist(ChannelType.EMAIL, 'test@mail.com', '1');

      expect(result).toBe(false);
    });

    it('should check DB and cache result', async () => {
      cacheMock.get.mockResolvedValue(undefined);
      repositoryMock.count.mockResolvedValue(1);

      const result = await service.isExist(ChannelType.EMAIL, 'test@mail.com');

      expect(result).toBe(true);
      expect(cacheMock.set).toHaveBeenCalledWith(expect.any(String), { exists: true }, { ttl: 60_000 });
    });
  });

  describe('saveList', () => {
    const person = {
      id: faker.string.uuid(),
    };

    it('should return empty array if no channels', async () => {
      const result = await service.saveList(person as any, []);
      expect(result).toEqual([]);
    });

    it('should CREATE new channel', async () => {
      const channelId = faker.string.uuid();

      repositoryMock.create.mockResolvedValue({
        get: () => ({
          id: channelId,
          type: ChannelType.EMAIL,
          value: 'test@mail.com',
          personId: person.id,
        }),
      });

      channelNotificationSettingsServiceMock.saveList.mockResolvedValue([
        {
          status: 1,
          type: 'system',
          quietRanges: 'mock',
        },
      ]);

      const result = await service.saveList(person as any, [
        {
          type: ChannelType.EMAIL,
          value: 'test@mail.com',
          status: 1,
          isVerified: true,
          settings: [],
        },
      ]);

      expect(repositoryMock.create).toHaveBeenCalled();

      expect(result.length).toBe(1);
      expect(result[0].settings?.length).toBe(1);
    });

    it('should UPDATE existing channel', async () => {
      const channelId = faker.string.uuid();

      repositoryMock.update.mockResolvedValue([1]);

      repositoryMock.findByPk.mockResolvedValue({
        get: () => ({
          id: channelId,
          type: ChannelType.PHONE,
          value: '+79990001122',
          personId: person.id,
        }),
      });

      channelNotificationSettingsServiceMock.saveList.mockResolvedValue([]);

      const result = await service.saveList(person as any, [
        {
          id: channelId,
          type: ChannelType.PHONE,
          value: '+79990001122',
          status: 1,
          isVerified: false,
          settings: [],
        },
      ]);

      expect(repositoryMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: channelId,
          personId: person.id,
        }),
        expect.objectContaining({
          where: { id: channelId },
        }),
      );

      expect(repositoryMock.findByPk).toHaveBeenCalledWith(channelId, expect.any(Object));

      expect(result.length).toBe(1);
    });

    it('should throw if updated channel not found', async () => {
      repositoryMock.update.mockResolvedValue([1]);
      repositoryMock.findByPk.mockResolvedValue(null);

      await expect(
        service.saveList(person as any, [
          {
            id: 'missing-id',
            type: ChannelType.EMAIL,
            value: 'test@mail.com',
            status: 1,
            isVerified: true,
            settings: [],
          },
        ]),
      ).rejects.toThrow(/not exists/i);
    });

    it('should call notification settings service', async () => {
      const channelId = faker.string.uuid();

      repositoryMock.create.mockResolvedValue({
        get: () => ({
          id: channelId,
          type: ChannelType.EMAIL,
          value: 'test@mail.com',
        }),
      });

      await service.saveList(person as any, [
        {
          type: ChannelType.EMAIL,
          value: 'test@mail.com',
          status: 1,
          isVerified: true,
          settings: [
            {
              type: NotificationType.SYSTEM,
              status: NotificationStatus.ACTIVE,
              quietRanges: {
                quietStart: 0,
                quietFinish: 60,
              },
            },
          ],
        },
      ]);

      expect(channelNotificationSettingsServiceMock.saveList).toHaveBeenCalled();
    });
  });
});
