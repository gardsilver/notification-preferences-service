/* eslint-disable @typescript-eslint/no-explicit-any */

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { DATABASE_DI } from 'src/modules/database';
import { NotificationType } from '../types/types';
import { NotificationDefaultSettingsService } from './notification-default-settings.service';
import { NotificationDefaultSettingsModel } from '../entities/notification-default-settings.model';

const mockRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  findByPk: jest.fn(),
  findAll: jest.fn(),
};

const mockSequelize = {
  transaction: jest.fn((cb: any) => cb({})),
};

describe('NotificationDefaultSettingsService', () => {
  let service: NotificationDefaultSettingsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: DATABASE_DI,
          useValue: mockSequelize,
        },
        NotificationDefaultSettingsService,
        {
          provide: getModelToken(NotificationDefaultSettingsModel),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get(NotificationDefaultSettingsService);
  });

  describe('findByType', () => {
    it('should return plain object if record exists', async () => {
      const model = {
        get: jest.fn().mockReturnValue({
          id: '1',
          type: NotificationType.SYSTEM,
        }),
      };

      mockRepository.findOne.mockResolvedValue(model);

      const result = await service.findByType(NotificationType.SYSTEM);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { type: NotificationType.SYSTEM },
      });

      expect(result).toEqual({
        id: '1',
        type: NotificationType.SYSTEM,
      });
    });

    it('should return null if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByType(NotificationType.SYSTEM);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return plain object', async () => {
      const input = {
        type: NotificationType.SYSTEM,
        quietRanges: {
          quietStart: 0,
          quietFinish: 0,
        },
      };

      const model = {
        get: jest.fn().mockReturnValue({
          id: '123',
          ...input,
          quietRanges: '{[0,0]}',
        }),
      };

      mockRepository.create.mockResolvedValue(model);

      const result = await service.create(input as any);

      expect(mockRepository.create).toHaveBeenCalledWith(
        {
          ...input,
          quietRanges: '{[0,0]}',
        },
        expect.objectContaining({}),
      );

      expect(result).toEqual({
        id: '123',
        ...input,
        quietRanges: {
          quietFinish: 0,
          quietStart: 0,
        },
      });
    });
  });

  describe('update', () => {
    it('should update record and return fresh entity', async () => {
      const id = '123';

      const updateData = {
        type: NotificationType.SYSTEM,
        quietRanges: {
          quietStart: 0,
          quietFinish: 0,
        },
      };

      mockRepository.update.mockResolvedValue([1]);

      mockRepository.findByPk.mockResolvedValue({
        get: jest.fn().mockReturnValue({
          id,
          type: updateData.type,
          quietRanges: '{[0,0]}',
        }),
      });

      const result = await service.update(id, updateData as any);

      expect(mockRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updateData,
          quietRanges: '{[0,0]}',
          updatedAt: expect.any(Date),
        }),
        expect.objectContaining({
          where: { id },
        }),
      );

      expect(result).toEqual({
        id,
        type: updateData.type,
        quietRanges: {
          quietFinish: 0,
          quietStart: 0,
        },
      });
    });

    it('should throw if record not found after update', async () => {
      mockRepository.update.mockResolvedValue([1]);
      mockRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.update('123', {
          type: NotificationType.SYSTEM,
          quietRanges: '{}',
        } as any),
      ).rejects.toThrow('Record for 123 is not exists!');
    });
  });

  describe('findAll', () => {
    it('should return mapped plain array', async () => {
      const models = [
        {
          get: jest.fn().mockReturnValue({ id: '1' }),
        },
        {
          get: jest.fn().mockReturnValue({ id: '2' }),
        },
      ];

      mockRepository.findAll.mockResolvedValue(models);

      const result = await service.findAll();

      expect(mockRepository.findAll).toHaveBeenCalled();

      expect(result).toEqual([
        { id: '1', quietRanges: { quietFinish: 0, quietStart: 0 } },
        { id: '2', quietRanges: { quietFinish: 0, quietStart: 0 } },
      ]);
    });
  });
});
