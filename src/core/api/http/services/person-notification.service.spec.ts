/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { PersonNotificationService as RepositoryService } from 'src/core/repositories/postgres';
import { ResponseStatus } from '../dto/base.dto';
import { PersonNotificationService } from './person-notification.service';
import { PersonNotificationDtoMapper } from '../mappers/person-notification.dto-mapper';
import { ErrorHandler } from '../handlers/error.handler';

describe('PersonNotificationService', () => {
  let service: PersonNotificationService;

  // Изолированные моки для всех внешних зависимостей
  const repositoryMock = {
    checkSend: jest.fn(),
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
        PersonNotificationService,
        {
          provide: RepositoryService,
          useValue: repositoryMock,
        },
        {
          provide: PersonNotificationDtoMapper,
          useValue: mapperMock,
        },
        {
          provide: ErrorHandler,
          useValue: errorHandlerMock,
        },
      ],
    }).compile();

    service = module.get<PersonNotificationService>(PersonNotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkSend', () => {
    it('should transform DTO, call repository and return mapped response successfully', async () => {
      const mockDto: any = { personId: '123', datetime: '2026-05-28' };
      const mockRepoInput = { personId: '123' };
      const mockDbResult = { status: true, reason: 'Allowed' };
      const mockFinalResponse = {
        status: ResponseStatus.SUCCESS, // или ResponseStatus.ALLOW в зависимости от ваших DTO
        details: 'Allowed',
      };

      // Настраиваем цепочку вызовов моков
      mapperMock.toRepositoryInput.mockReturnValue(mockRepoInput);
      repositoryMock.checkSend.mockResolvedValue(mockDbResult);
      mapperMock.toResponse.mockReturnValue(mockFinalResponse);

      const result = await service.checkSend(mockDto);

      // Проверяем корректность вызовов и переданных аргументов
      expect(mapperMock.toRepositoryInput).toHaveBeenCalledWith(mockDto);
      expect(repositoryMock.checkSend).toHaveBeenCalledWith(mockRepoInput);
      expect(mapperMock.toResponse).toHaveBeenCalledWith(mockDbResult);
      expect(result).toEqual(mockFinalResponse);
    });

    it('should catch repository errors and forward them to ErrorHandler with context "Person"', async () => {
      const mockDto: any = { personId: '123' };
      const dbError = new Error('Database connection timeout');

      repositoryMock.checkSend.mockRejectedValue(dbError);

      // Имитируем поведение ErrorHandler, который прерывает выполнение исключением NestJS
      errorHandlerMock.handle.mockImplementation(() => {
        throw new InternalServerErrorException();
      });

      await expect(service.checkSend(mockDto)).rejects.toBeInstanceOf(InternalServerErrorException);

      // Самая важная проверка: что ошибка ушла в хэндлер со строкой контекста 'Person'
      expect(errorHandlerMock.handle).toHaveBeenCalledWith(dbError, 'Person');
    });
  });
});
