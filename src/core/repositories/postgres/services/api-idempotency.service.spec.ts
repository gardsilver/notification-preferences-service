/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { faker } from '@faker-js/faker';
import { DATABASE_DI } from 'src/modules/database';
import { MockSequelize } from 'tests/sequelize-typescript';
import { ApiIdempotencyModel } from '../entities/api-idempotency.model';
import { ApiIdempotencyService } from './api-idempotency.service';

describe('ApiIdempotencyService', () => {
  let service: ApiIdempotencyService;
  let customSequelizeMock: MockSequelize & { transaction: jest.Mock };
  let mockRepository: any;

  // Имитируем структуру объекта транзакции Sequelize, содержащего типы блокировок
  const mockTransactionInstance = {
    LOCK: {
      UPDATE: 'UPDATE',
    },
  };

  beforeEach(async () => {
    // 1. Создаем экземпляр вашего MockSequelize
    const baseMock = new MockSequelize();

    // 2. Дополняем его методом transaction, так как сервис ожидает его наличие
    customSequelizeMock = Object.assign(baseMock, {
      transaction: jest.fn().mockImplementation(async (cb: (t: any) => Promise<any>) => {
        return cb(mockTransactionInstance); // Выполняем колбэк из сервиса, передавая мок транзакции
      }),
    });

    mockRepository = {
      findByPk: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiIdempotencyService,
        {
          provide: DATABASE_DI,
          useValue: customSequelizeMock, // Передаем ваш адаптированный мок
        },
        {
          provide: getModelToken(ApiIdempotencyModel),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ApiIdempotencyService>(ApiIdempotencyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByPk', () => {
    it('should find a record by primary key inside a transaction with UPDATE lock', async () => {
      const idempotencyKey = faker.string.uuid();
      const mockResult = {
        id: idempotencyKey,
        createdAt: new Date(),
        requestHash: faker.string.hexadecimal({ length: 64, casing: 'lower', prefix: '' }),
        responseCode: 200,
        responseBody: { success: true },
      };

      const mockModel = {
        ...mockResult,
        get: jest.fn().mockResolvedValue(mockResult),
      };

      mockRepository.findByPk.mockResolvedValue(mockModel);

      const result = await service.findByPk(idempotencyKey);

      // Проверяем, что метод transaction на вашем моке действительно вызвался
      expect(customSequelizeMock.transaction).toHaveBeenCalledTimes(1);
      expect(mockRepository.findByPk).toHaveBeenCalledWith(idempotencyKey, {
        lock: mockTransactionInstance.LOCK.UPDATE,
        transaction: mockTransactionInstance,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('create', () => {
    it('should successfully create a new record', async () => {
      const inputData = {
        id: faker.string.uuid(),
        requestHash: faker.string.hexadecimal({ length: 64, casing: 'lower', prefix: '' }),
        responseCode: 0,
        responseBody: {},
      };

      const mockResult = {
        ...inputData,
        createdAt: new Date(),
      };

      const mockModel = {
        ...mockResult,
        get: jest.fn().mockResolvedValue(mockResult),
      };

      mockRepository.create.mockResolvedValue(mockModel);

      await service.create(inputData);

      expect(mockRepository.create).toHaveBeenCalledWith(inputData, { transaction: mockTransactionInstance });
    });
  });

  describe('update', () => {
    it('should update specific fields of a record', async () => {
      const idempotencyKey = faker.string.uuid();
      const updateData = {
        responseCode: 201,
        responseBody: { status: 'processed' },
      };

      mockRepository.update.mockResolvedValue([1]);

      await service.update(idempotencyKey, updateData);

      expect(mockRepository.update).toHaveBeenCalledWith(updateData, {
        where: { id: idempotencyKey },
        transaction: mockTransactionInstance,
      });
    });
  });

  describe('destroy', () => {
    it('should delete a record by its idempotency key', async () => {
      const idempotencyKey = faker.string.uuid();
      mockRepository.destroy.mockResolvedValue(1);

      await service.destroy(idempotencyKey);

      expect(mockRepository.destroy).toHaveBeenCalledWith({
        where: { id: idempotencyKey },
        transaction: mockTransactionInstance,
      });
    });
  });
});
