/* eslint-disable @typescript-eslint/no-explicit-any */

import { Test, TestingModule } from '@nestjs/testing';
import {
  NotificationDefaultSettingsService as RepositoryService,
  NotificationType,
} from 'src/core/repositories/postgres';
import { ResponseStatus } from '../dto/base.dto';
import { NotificationDefaultSettingsService } from './notification-default-settings.service';

describe('NotificationDefaultSettingsService (API layer)', () => {
  let service: NotificationDefaultSettingsService;

  const repositoryMock = {
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationDefaultSettingsService,
        {
          provide: RepositoryService,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get(NotificationDefaultSettingsService);
  });

  describe('create', () => {
    it('should create and return id', async () => {
      repositoryMock.create.mockResolvedValue({
        id: '123',
        quietRanges: {
          quietStart: 10,
          quietFinish: 20,
        },
      });

      const dto = {
        type: NotificationType.SYSTEM,
        quietStart: 10,
        quietFinish: 20,
      } as any;

      const result = await service.create(dto);

      expect(repositoryMock.create).toHaveBeenCalled();

      expect(result).toEqual({
        status: ResponseStatus.SUCCESS,
        data: { id: '123', quietStart: '00:10', quietFinish: '00:20' },
      });
    });

    it('should throw BadRequestException on unique constraint', async () => {
      repositoryMock.create.mockRejectedValue({
        name: 'SequelizeUniqueConstraintError',
      });

      await expect(
        service.create({
          type: NotificationType.SYSTEM,
          quietStart: 10,
          quietFinish: 20,
        } as any),
      ).rejects.toMatchObject({
        response: {
          status: ResponseStatus.ERROR,
        },
      });
    });

    it('should throw InternalServerErrorException on unknown error', async () => {
      repositoryMock.create.mockRejectedValue(new Error('DB fail'));

      await expect(
        service.create({
          type: NotificationType.SYSTEM,
        } as any),
      ).rejects.toMatchObject({
        response: {
          status: ResponseStatus.ERROR,
        },
      });
    });
  });

  describe('update', () => {
    it('should update and return id', async () => {
      repositoryMock.update.mockResolvedValue({
        id: '999',
        quietRanges: {
          quietStart: 5,
          quietFinish: 15,
        },
      });

      const dto = {
        id: '999',
        type: NotificationType.SYSTEM,
        quietStart: 5,
        quietFinish: 15,
      } as any;

      const result = await service.update(dto);

      expect(repositoryMock.update).toHaveBeenCalledWith(
        '999',
        expect.objectContaining({
          type: NotificationType.SYSTEM,
          quietRanges: { quietStart: 5, quietFinish: 15 },
        }),
      );

      expect(result).toEqual({
        status: ResponseStatus.SUCCESS,
        data: { id: '999', quietStart: '00:05', quietFinish: '00:15' },
      });
    });

    it('should throw BadRequestException on unique constraint', async () => {
      repositoryMock.update.mockRejectedValue({
        name: 'SequelizeUniqueConstraintError',
      });

      await expect(
        service.update({
          id: '1',
          type: NotificationType.SYSTEM,
        } as any),
      ).rejects.toMatchObject({
        response: {
          status: ResponseStatus.ERROR,
        },
      });
    });

    it('should throw InternalServerErrorException on unknown error', async () => {
      repositoryMock.update.mockRejectedValue(new Error('DB fail'));

      await expect(
        service.update({
          id: '1',
          type: NotificationType.SYSTEM,
        } as any),
      ).rejects.toMatchObject({
        response: {
          status: ResponseStatus.ERROR,
        },
      });
    });
  });
});
