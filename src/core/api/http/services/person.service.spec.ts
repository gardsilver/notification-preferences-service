/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PersonService as RepositoryService } from 'src/core/repositories/postgres';
import { ResponseStatus } from '../dto/base.dto';
import { PersonService } from './person.service';
import { PersonDtoMapper } from '../mappers/person.dto-mapper';
import { ErrorHandler } from '../handlers/error.handler';

describe('PersonService', () => {
  let service: PersonService;

  // Изолированные моки зависимостей
  const repositoryMock = {
    info: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mapperMock = {
    toResponse: jest.fn(),
    toPerson: jest.fn(),
    toChannels: jest.fn(),
  };

  const errorHandlerMock = {
    handle: jest.fn(),
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
        {
          provide: PersonDtoMapper,
          useValue: mapperMock,
        },
        {
          provide: ErrorHandler,
          useValue: errorHandlerMock,
        },
      ],
    }).compile();

    service = module.get<PersonService>(PersonService);
  });

  describe('info', () => {
    it('should return mapped response successfully', async () => {
      const mockDbData = { id: 'uuid-1', firstName: 'John', channels: [] };
      const mockMappedResponse = {
        status: ResponseStatus.SUCCESS,
        data: { id: 'uuid-1', channels: [] },
      };

      repositoryMock.info.mockResolvedValue(mockDbData);
      mapperMock.toResponse.mockReturnValue(mockMappedResponse);

      const result = await service.info('uuid-1');

      expect(repositoryMock.info).toHaveBeenCalledWith('uuid-1');
      expect(mapperMock.toResponse).toHaveBeenCalledWith(mockDbData);
      expect(result).toEqual(mockMappedResponse);
    });

    it('should pass error and context to ErrorHandler on repository failure', async () => {
      const dbError = new Error('DB connection failed');
      repositoryMock.info.mockRejectedValue(dbError);

      errorHandlerMock.handle.mockImplementation(() => {
        throw new InternalServerErrorException();
      });

      await expect(service.info('uuid-1')).rejects.toBeInstanceOf(InternalServerErrorException);
      expect(errorHandlerMock.handle).toHaveBeenCalledWith(dbError, 'Person');
    });
  });

  describe('create', () => {
    it('should transform inputs, save via repository and return mapped response', async () => {
      const dto: any = { name: 'Alice', channels: [] };
      const mockPersonEntity = { firstName: 'Alice' };
      const mockChannelsEntity: any[] = [];
      const mockDbData = { id: 'uuid-2', firstName: 'Alice', channels: [] };
      const mockFinalResponse = {
        status: ResponseStatus.SUCCESS,
        data: { id: 'uuid-2', firstName: 'Alice', channels: [] },
      };

      mapperMock.toPerson.mockReturnValue(mockPersonEntity);
      mapperMock.toChannels.mockReturnValue(mockChannelsEntity);
      repositoryMock.create.mockResolvedValue(mockDbData);
      mapperMock.toResponse.mockReturnValue(mockFinalResponse);

      const result = await service.create(dto);

      expect(mapperMock.toPerson).toHaveBeenCalledWith(dto);
      expect(mapperMock.toChannels).toHaveBeenCalledWith(dto);
      expect(repositoryMock.create).toHaveBeenCalledWith(mockPersonEntity, mockChannelsEntity);
      expect(mapperMock.toResponse).toHaveBeenCalledWith(mockDbData);
      expect(result).toEqual(mockFinalResponse);
    });

    it('should pass error and context to ErrorHandler on creation failure', async () => {
      const dto: any = { name: 'Alice' };
      const uniqueError = { name: 'SequelizeUniqueConstraintError' };

      repositoryMock.create.mockRejectedValue(uniqueError);
      errorHandlerMock.handle.mockImplementation(() => {
        throw new BadRequestException();
      });

      await expect(service.create(dto)).rejects.toBeInstanceOf(BadRequestException);
      expect(errorHandlerMock.handle).toHaveBeenCalledWith(uniqueError, 'Person');
    });
  });

  describe('update', () => {
    it('should transform inputs, update via repository and return inline success response', async () => {
      const dto: any = { id: 'uuid-3', name: 'Bob', channels: [] };
      const mockPersonEntity = { firstName: 'Bob' };
      const mockChannelsEntity: any[] = [];
      const mockDbData = { id: 'uuid-3', firstName: 'Bob', channels: [] };

      mapperMock.toPerson.mockReturnValue(mockPersonEntity);
      mapperMock.toChannels.mockReturnValue(mockChannelsEntity);
      repositoryMock.update.mockResolvedValue(mockDbData);

      const result = await service.update(dto);

      expect(mapperMock.toPerson).toHaveBeenCalledWith(dto);
      expect(mapperMock.toChannels).toHaveBeenCalledWith(dto);
      expect(repositoryMock.update).toHaveBeenCalledWith('uuid-3', mockPersonEntity, mockChannelsEntity);
      expect(result).toEqual({
        status: ResponseStatus.SUCCESS,
        data: mockDbData,
      });
    });

    it('should pass error and context to ErrorHandler on update failure', async () => {
      const dto: any = { id: 'uuid-3' };
      const runtimeError = new TypeError('Cannot read property of undefined');

      repositoryMock.update.mockRejectedValue(runtimeError);
      errorHandlerMock.handle.mockImplementation(() => {
        throw new InternalServerErrorException();
      });

      await expect(service.update(dto)).rejects.toBeInstanceOf(InternalServerErrorException);
      expect(errorHandlerMock.handle).toHaveBeenCalledWith(runtimeError, 'Person');
    });
  });
});
