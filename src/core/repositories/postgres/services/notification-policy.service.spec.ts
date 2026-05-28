/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { NotificationPolicyService } from './notification-policy.service';
import { NotificationPolicyModel } from '../entities/notification-policy.model';
import { DATABASE_DI } from 'src/modules/database';
import { NotificationStatus, NotificationType, ChannelType } from '../types/types';

describe('NotificationPolicyService (Repository layer)', () => {
  let service: NotificationPolicyService;

  // Мок инстанса модели для метода .get({ plain: true })
  const mockModelInstance = {
    get: jest.fn(),
  };

  // Мок репозитория моделей Sequelize
  const repositoryMock = {
    create: jest.fn(),
    update: jest.fn(),
    findByPk: jest.fn(),
  };

  // Мок Sequelize для управления транзакциями
  const dbMock = {
    transaction: jest.fn((cb) => cb('mock-transaction-object')), // Сразу выполняет колбэк, передавая туда транзакцию
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationPolicyService,
        {
          provide: DATABASE_DI,
          useValue: dbMock,
        },
        {
          provide: getModelToken(NotificationPolicyModel),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<NotificationPolicyService>(NotificationPolicyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create record inside transaction and return plain data object', async () => {
      const inputData: any = {
        status: NotificationStatus.ACTIVE,
        notificationType: NotificationType.MARKETING,
        channelType: ChannelType.EMAIL,
        regionCode: 'RU',
      };

      const plainResult = { id: 'uuid-1', ...inputData };

      repositoryMock.create.mockResolvedValue(mockModelInstance);
      mockModelInstance.get.mockReturnValue(plainResult);

      const result = await service.create(inputData);

      expect(dbMock.transaction).toHaveBeenCalled();
      expect(repositoryMock.create).toHaveBeenCalledWith(inputData, {
        transaction: 'mock-transaction-object',
      });
      expect(mockModelInstance.get).toHaveBeenCalledWith({ plain: true });
      expect(result).toEqual(plainResult);
    });
  });

  describe('update', () => {
    const recordId = 'uuid-123';
    const updateFields: any = {
      status: NotificationStatus.DISABLED,
    };

    it('should perform update and return updated data if record exists', async () => {
      const expectedPlainObject = { id: recordId, status: NotificationStatus.DISABLED, regionCode: 'RU' };

      repositoryMock.update.mockResolvedValue([1]); // Sequelize возвращает количество затронутых строк массивом
      repositoryMock.findByPk.mockResolvedValue(mockModelInstance);
      mockModelInstance.get.mockReturnValue(expectedPlainObject);

      const result = await service.update(recordId, updateFields);

      expect(dbMock.transaction).toHaveBeenCalled();
      expect(repositoryMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: NotificationStatus.DISABLED,
          updatedAt: expect.any(Date),
        }),
        {
          transaction: 'mock-transaction-object',
          where: { id: recordId },
        },
      );
      expect(repositoryMock.findByPk).toHaveBeenCalledWith(recordId, {
        transaction: 'mock-transaction-object',
      });
      expect(result).toEqual(expectedPlainObject);
    });

    it('should skip calling repository.update if empty data object is provided', async () => {
      const emptyData = {};
      const expectedPlainObject = { id: recordId, status: NotificationStatus.ACTIVE };

      repositoryMock.findByPk.mockResolvedValue(mockModelInstance);
      mockModelInstance.get.mockReturnValue(expectedPlainObject);

      const result = await service.update(recordId, emptyData);

      expect(repositoryMock.update).not.toHaveBeenCalled();
      expect(repositoryMock.findByPk).toHaveBeenCalledWith(recordId, {
        transaction: 'mock-transaction-object',
      });
      expect(result).toEqual(expectedPlainObject);
    });

    it('should throw Error if record is not found after update', async () => {
      repositoryMock.update.mockResolvedValue([1]);
      repositoryMock.findByPk.mockResolvedValue(null); // Имитируем, что запись не найдена

      await expect(service.update(recordId, updateFields)).rejects.toThrow(`Record for ${recordId} is not exists!`);

      expect(repositoryMock.findByPk).toHaveBeenCalledWith(recordId, {
        transaction: 'mock-transaction-object',
      });
    });
  });
});
