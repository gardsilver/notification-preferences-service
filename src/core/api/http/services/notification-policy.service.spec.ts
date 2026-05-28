/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { NotificationPolicyService as RepositoryService } from 'src/core/repositories/postgres';
import { ResponseStatus } from '../dto/base.dto';
import { NotificationPolicyService } from './notification-policy.service';
import { NotificationPolicyMapper } from '../mappers/notification-policy.dto-mapper';
import { ErrorHandler } from '../handlers/error.handler';

describe('NotificationPolicyService', () => {
  let service: NotificationPolicyService;

  // Моки внешних зависимостей слоя данных, маппинга и ошибок
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
        NotificationPolicyService,
        {
          provide: RepositoryService,
          useValue: repositoryMock,
        },
        {
          provide: NotificationPolicyMapper,
          useValue: mapperMock,
        },
        {
          provide: ErrorHandler,
          useValue: errorHandlerMock,
        },
      ],
    }).compile();

    service = module.get<NotificationPolicyService>(NotificationPolicyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should transform DTO, call repository create and return mapped response successfully', async () => {
      const mockDto: any = { type: 'EMAIL', channelType: 'email', regionCode: 'RU' };
      const mockRepoInput = { notificationType: 'marketing', channelType: 'email', regionCode: 'RU' };
      const mockDbResult = { id: 'policy-uuid-1', channelType: 'email' };
      const mockFinalResponse = {
        status: ResponseStatus.SUCCESS,
        data: { id: 'policy-uuid-1', channelType: 'email' },
      };

      // Настройка поведения моков
      mapperMock.toRepositoryInput.mockReturnValue(mockRepoInput);
      repositoryMock.create.mockResolvedValue(mockDbResult);
      mapperMock.toResponse.mockReturnValue(mockFinalResponse);

      const result = await service.create(mockDto);

      // Проверка последовательности вызовов и аргументов
      expect(mapperMock.toRepositoryInput).toHaveBeenCalledWith(mockDto);
      expect(repositoryMock.create).toHaveBeenCalledWith(mockRepoInput);
      expect(mapperMock.toResponse).toHaveBeenCalledWith(mockDbResult);
      expect(result).toEqual(mockFinalResponse);
    });

    it('should delegate repository errors to ErrorHandler with context "NotificationPolicy"', async () => {
      const mockDto: any = { type: 'EMAIL' };
      const dbError = new Error('SequelizeUniqueConstraintError mock');

      repositoryMock.create.mockRejectedValue(dbError);

      // Имитируем поведение ErrorHandler, прерывающего выполнение ошибкой NestJS
      errorHandlerMock.handle.mockImplementation(() => {
        throw new BadRequestException();
      });

      await expect(service.create(mockDto)).rejects.toBeInstanceOf(BadRequestException);

      // Проверяем корректную передачу ошибки и контекста строкой
      expect(errorHandlerMock.handle).toHaveBeenCalledWith(dbError, 'NotificationPolicy');
    });
  });

  describe('update', () => {
    it('should transform DTO, call repository update with id and return mapped response', async () => {
      const mockDto: any = { id: 'policy-uuid-2', status: 1 };
      const mockRepoInput = { status: 1 };
      const mockDbResult = { id: 'policy-uuid-2', status: 1 };
      const mockFinalResponse = {
        status: ResponseStatus.SUCCESS,
        data: { id: 'policy-uuid-2', status: 1 },
      };

      mapperMock.toRepositoryInput.mockReturnValue(mockRepoInput);
      repositoryMock.update.mockResolvedValue(mockDbResult);
      mapperMock.toResponse.mockReturnValue(mockFinalResponse);

      const result = await service.update(mockDto);

      expect(mapperMock.toRepositoryInput).toHaveBeenCalledWith(mockDto);
      expect(repositoryMock.update).toHaveBeenCalledWith('policy-uuid-2', mockRepoInput);
      expect(mapperMock.toResponse).toHaveBeenCalledWith(mockDbResult);
      expect(result).toEqual(mockFinalResponse);
    });

    it('should delegate update errors to ErrorHandler with context "NotificationPolicy"', async () => {
      const mockDto: any = { id: 'policy-uuid-2' };
      const dbError = new Error('Connection lost');

      repositoryMock.update.mockRejectedValue(dbError);

      errorHandlerMock.handle.mockImplementation(() => {
        throw new InternalServerErrorException();
      });

      await expect(service.update(mockDto)).rejects.toBeInstanceOf(InternalServerErrorException);
      expect(errorHandlerMock.handle).toHaveBeenCalledWith(dbError, 'NotificationPolicy');
    });
  });
});
