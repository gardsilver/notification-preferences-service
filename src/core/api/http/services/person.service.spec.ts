/* eslint-disable @typescript-eslint/no-explicit-any */

import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException, BadRequestException } from '@nestjs/common';

import { PersonService } from './person.service';
import { PersonService as RepositoryService } from 'src/core/repositories/postgres';
import { ResponseStatus } from '../dto/base.dto';

jest.mock('../helpers/datetime.helper', () => ({
  DatetimeHelper: {
    minutesToTime: jest.fn((v: number) => `T${v}`),
  },
}));

describe('PersonService (API layer)', () => {
  let service: PersonService;

  const repositoryMock = {
    info: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonService,
        {
          provide: RepositoryService,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get(PersonService);
  });

  describe('info', () => {
    it('should return mapped response', async () => {
      repositoryMock.info.mockResolvedValue({
        id: '1',
        middleName: null,
        channels: [
          {
            id: 'c1',
            label: null,
            settings: [
              {
                quietRanges: {
                  quietStart: 10,
                  quietFinish: 20,
                },
              },
            ],
          },
        ],
      });

      const result = await service.info('1');

      expect(repositoryMock.info).toHaveBeenCalledWith('1');
      expect(result.status).toBe(ResponseStatus.SUCCESS);
      expect(result.data?.id).toBe('1');
      expect(result.data?.channels[0]?.settings[0]?.quietRanges).toEqual({
        quietStart: 'T10',
        quietFinish: 'T20',
      });
    });

    it('should throw BadRequestException on unique constraint', async () => {
      repositoryMock.info.mockRejectedValue({
        name: 'SequelizeUniqueConstraintError',
      });

      await expect(service.info('1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw InternalServerErrorException on unknown error', async () => {
      repositoryMock.info.mockRejectedValue(new Error('DB crash'));

      await expect(service.info('1')).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('create', () => {
    it('should call repository and return mapped response', async () => {
      repositoryMock.create.mockResolvedValue({
        id: '1',
        channels: [],
      });

      const dto: any = {
        name: 'John',
        channels: [],
      };

      const result = await service.create(dto);

      expect(repositoryMock.create).toHaveBeenCalled();
      expect(result.status).toBe(ResponseStatus.SUCCESS);
      expect(result.data?.id).toBe('1');
    });

    it('should map DTO to repository input (channels)', async () => {
      repositoryMock.create.mockResolvedValue({
        id: '1',
        channels: [],
      });

      const dto: any = {
        name: 'John',
        channels: [
          {
            type: 'EMAIL',
            value: 'test@mail.com',
            settings: [
              {
                type: 'system',
                quietRanges: { quietStart: 10, quietFinish: 20 },
              },
            ],
          },
        ],
      };

      await service.create(dto);

      expect(repositoryMock.create).toHaveBeenCalledWith(expect.any(Object), expect.any(Array));
    });
  });

  describe('update', () => {
    it('should return success response with data', async () => {
      repositoryMock.update.mockResolvedValue({
        id: '1',
        channels: [],
      });

      const dto: any = {
        id: '1',
        name: 'Updated',
        channels: [],
      };

      const result = await service.update(dto);

      expect(repositoryMock.update).toHaveBeenCalledWith('1', expect.any(Object), expect.any(Array));

      expect(result.status).toBe(ResponseStatus.SUCCESS);
      expect(result.data?.id).toBe('1');
    });

    it('should throw BadRequestException on unique constraint', async () => {
      repositoryMock.update.mockRejectedValue({
        name: 'SequelizeUniqueConstraintError',
      });

      await expect(service.update({ id: '1' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw InternalServerErrorException on unknown error', async () => {
      repositoryMock.update.mockRejectedValue(new Error('DB fail'));

      await expect(service.update({ id: '1' } as any)).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('mapResponse edge cases via info', () => {
    it('should handle null fields correctly', async () => {
      repositoryMock.info.mockResolvedValue({
        id: null,
        middleName: null,
        channels: [],
      });

      const result = await service.info('1');

      expect(result.data?.id).toBeUndefined();
      expect(result.data?.middleName).toBeUndefined();
    });
  });
});
