/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { NotificationDefaultSettingsService as RepositoryService } from 'src/core/repositories/postgres';
import { ResponseStatus } from '../dto/base.dto';
import { NotificationDefaultSettingsService } from './notification-default-settings.service';
import { NotificationDefaultSettingsDtoMapper } from '../mappers/notification-default-settings.dto-mapper';
import { ErrorHandler } from '../handlers/error.handler';

describe('NotificationDefaultSettingsService', () => {
  let service: NotificationDefaultSettingsService;

  // Моки внешних зависимостей
  const repositoryMock = {
    create: jest.fn(),
    update: jest.fn(),
  };

  const mapperMock = {
    toRepositoryInput: jest.fn(),
    toResponse: jest.fn(),
  };

  const errorHandlerMock = {
    handle: jest.fn(),
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
        {
          provide: NotificationDefaultSettingsDtoMapper,
          useValue: mapperMock,
        },
        {
          provide: ErrorHandler,
          useValue: errorHandlerMock,
        },
      ],
    }).compile();

    service = module.get<NotificationDefaultSettingsService>(NotificationDefaultSettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should transform DTO, call repository create and return mapped response', async () => {
      const mockDto: any = { type: 'EMAIL', quietStart: 60 };
      const mockRepoInput = { type: 'EMAIL', quietRanges: { quietStart: 60 } };
      const mockDbResult = { id: 'settings-1', type: 'EMAIL' };
      const mockFinalResponse = {
        status: ResponseStatus.SUCCESS,
        data: { id: 'settings-1', type: 'EMAIL' },
      };

      mapperMock.toRepositoryInput.mockReturnValue(mockRepoInput);
      repositoryMock.create.mockResolvedValue(mockDbResult);
      mapperMock.toResponse.mockReturnValue(mockFinalResponse);

      const result = await service.create(mockDto);

      expect(mapperMock.toRepositoryInput).toHaveBeenCalledWith(mockDto);
      expect(repositoryMock.create).toHaveBeenCalledWith(mockRepoInput);
      expect(mapperMock.toResponse).toHaveBeenCalledWith(mockDbResult);
      expect(result).toEqual(mockFinalResponse);
    });

    it('should delegate repository errors to ErrorHandler with context "NotificationDefaultSettings"', async () => {
      const mockDto: any = { type: 'EMAIL' };
      const dbError = new Error('Unique constraint violation');

      repositoryMock.create.mockRejectedValue(dbError);
      errorHandlerMock.handle.mockImplementation(() => {
        throw new BadRequestException();
      });

      await expect(service.create(mockDto)).rejects.toBeInstanceOf(BadRequestException);
      expect(errorHandlerMock.handle).toHaveBeenCalledWith(dbError, 'NotificationDefaultSettings');
    });
  });

  describe('update', () => {
    it('should transform DTO, call repository update with id and return mapped response', async () => {
      const mockDto: any = { id: 'settings-2', type: 'SMS' };
      const mockRepoInput = { type: 'SMS' };
      const mockDbResult = { id: 'settings-2', type: 'SMS' };
      const mockFinalResponse = {
        status: ResponseStatus.SUCCESS,
        data: { id: 'settings-2', type: 'SMS' },
      };

      mapperMock.toRepositoryInput.mockReturnValue(mockRepoInput);
      repositoryMock.update.mockResolvedValue(mockDbResult);
      mapperMock.toResponse.mockReturnValue(mockFinalResponse);

      const result = await service.update(mockDto);

      expect(mapperMock.toRepositoryInput).toHaveBeenCalledWith(mockDto);
      expect(repositoryMock.update).toHaveBeenCalledWith('settings-2', mockRepoInput);
      expect(mapperMock.toResponse).toHaveBeenCalledWith(mockDbResult);
      expect(result).toEqual(mockFinalResponse);
    });

    it('should delegate update errors to ErrorHandler with context "NotificationDefaultSettings"', async () => {
      const mockDto: any = { id: 'settings-2' };
      const dbError = new Error('Database crash');

      repositoryMock.update.mockRejectedValue(dbError);
      errorHandlerMock.handle.mockImplementation(() => {
        throw new InternalServerErrorException();
      });

      await expect(service.update(mockDto)).rejects.toBeInstanceOf(InternalServerErrorException);
      expect(errorHandlerMock.handle).toHaveBeenCalledWith(dbError, 'NotificationDefaultSettings');
    });
  });
});
