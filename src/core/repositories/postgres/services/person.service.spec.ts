/* eslint-disable @typescript-eslint/no-explicit-any */
import { faker } from '@faker-js/faker';
import { Sequelize } from 'sequelize-typescript';
import { ChannelType, NotificationStatus, NotificationType } from '../types/types';
import { PersonService } from './person.service';

describe('PersonService', () => {
  let service: PersonService;

  let dbMock: {
    transaction: jest.Mock;
  };

  let repositoryMock: {
    findOne: jest.Mock;
    findByPk: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };

  let channelServiceMock: {
    isExist: jest.Mock;
    saveList: jest.Mock;
  };

  beforeEach(() => {
    dbMock = {
      transaction: jest.fn(async (cb) => cb('mock-transaction')),
    };

    repositoryMock = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    channelServiceMock = {
      isExist: jest.fn(),
      saveList: jest.fn(),
    };

    service = new PersonService(dbMock as unknown as Sequelize, repositoryMock as any, channelServiceMock as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return person', async () => {
      const personId = faker.string.uuid();

      const personPlain = {
        id: personId,
        firstName: faker.person.firstName(),
      };

      repositoryMock.findOne.mockResolvedValue({
        get: jest.fn().mockReturnValue(personPlain),
      });

      const result = await service.findById(personId);

      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: {
          id: personId,
        },
      });

      expect(result).toEqual(personPlain);
    });

    it('should return null when person not found', async () => {
      repositoryMock.findOne.mockResolvedValue(null);

      const result = await service.findById(faker.string.uuid());

      expect(result).toBeNull();
    });
  });

  describe('isChannelExist', () => {
    it('should proxy call to channelService', async () => {
      channelServiceMock.isExist.mockResolvedValue(true);

      const result = await service.isChannelExist(ChannelType.EMAIL, 'test@test.com', 'exclude-id');

      expect(channelServiceMock.isExist).toHaveBeenCalledWith(ChannelType.EMAIL, 'test@test.com', 'exclude-id');

      expect(result).toBe(true);
    });
  });

  describe('info', () => {
    it('should return person with channels and settings', async () => {
      const personId = faker.string.uuid();

      const settingsModel = {
        quietRanges: 'mock-range',
        get: jest.fn().mockReturnValue({
          status: NotificationStatus.ACTIVE,
          type: NotificationType.SYSTEM,
          quietRanges: 'mock-range',
        }),
      };

      const channelModel = {
        settings: [settingsModel],
        get: jest.fn().mockReturnValue({
          id: faker.string.uuid(),
          type: ChannelType.EMAIL,
          value: faker.internet.email(),
        }),
      };

      const personModel = {
        channels: [channelModel],
        get: jest.fn().mockReturnValue({
          id: personId,
          firstName: faker.person.firstName(),
        }),
      };

      repositoryMock.findByPk.mockResolvedValue(personModel);

      const result = await service.info(personId);

      expect(repositoryMock.findByPk).toHaveBeenCalled();

      expect(result.id).toBe(personId);

      expect(result.channels).toHaveLength(1);

      expect(result.channels[0].settings).toHaveLength(1);
    });

    it('should throw if person not found', async () => {
      repositoryMock.findByPk.mockResolvedValue(null);

      await expect(service.info(faker.string.uuid())).rejects.toThrow(/not exists/i);
    });
  });

  describe('create', () => {
    it('should create person with channels', async () => {
      const personId = faker.string.uuid();

      const personData = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        birthday: '1990-01-01',
        regionCode: 'DE',
        timezone: 'Europe/Berlin',
      };

      const savedPersonPlain = {
        id: personId,
        ...personData,
      };

      const savedPersonModel = {
        get: jest.fn().mockReturnValue(savedPersonPlain),
      };

      repositoryMock.create.mockResolvedValue(savedPersonModel);

      channelServiceMock.saveList.mockResolvedValue([
        {
          id: faker.string.uuid(),
          type: ChannelType.EMAIL,
          value: faker.internet.email(),
        },
      ]);

      const result = await service.create(personData, []);

      expect(dbMock.transaction).toHaveBeenCalled();

      expect(repositoryMock.create).toHaveBeenCalled();

      expect(channelServiceMock.saveList).toHaveBeenCalled();

      expect(result).toEqual({
        ...savedPersonPlain,
        channels: expect.any(Array),
      });
    });
  });

  describe('update', () => {
    it('should update person and channels', async () => {
      const personId = faker.string.uuid();

      const updatedPerson = {
        id: personId,
        firstName: faker.person.firstName(),
      };

      repositoryMock.update.mockResolvedValue([1]);

      repositoryMock.findByPk.mockResolvedValue({
        get: jest.fn().mockReturnValue(updatedPerson),
      });

      channelServiceMock.saveList.mockResolvedValue([]);

      const result = await service.update(
        personId,
        {
          firstName: updatedPerson.firstName,
        },
        [],
      );

      expect(repositoryMock.update).toHaveBeenCalled();

      expect(repositoryMock.findByPk).toHaveBeenCalledWith(personId, {
        transaction: 'mock-transaction',
      });

      expect(result.id).toBe(personId);
    });

    it('should throw if updated person not found', async () => {
      repositoryMock.findByPk.mockResolvedValue(null);

      await expect(
        service.update(
          faker.string.uuid(),
          {
            firstName: faker.person.firstName(),
          },
          [],
        ),
      ).rejects.toThrow(/not exists/i);
    });

    it('should skip update when personData is empty', async () => {
      const personId = faker.string.uuid();

      repositoryMock.findByPk.mockResolvedValue({
        get: jest.fn().mockReturnValue({
          id: personId,
        }),
      });

      channelServiceMock.saveList.mockResolvedValue([]);

      await service.update(personId, {}, []);

      expect(repositoryMock.update).not.toHaveBeenCalled();
    });
  });
});
