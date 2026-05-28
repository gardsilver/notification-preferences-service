/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseError, ValidationErrorItem } from 'sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ELK_LOGGER_SERVICE_BUILDER_DI } from 'src/modules/elk-logger';
import { ResponseStatus } from '../dto/base.dto';
import { ErrorHandler } from './error.handler';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  // Создаем шпионы для методов логгера
  const mockLogger = {
    error: jest.fn(),
  };

  // Создаем билдер логгеров, который возвращает наш мок
  const mockLoggerBuilder = {
    build: jest.fn().mockReturnValue(mockLogger),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ErrorHandler,
        {
          provide: ELK_LOGGER_SERVICE_BUILDER_DI,
          useValue: mockLoggerBuilder,
        },
      ],
    }).compile();

    errorHandler = module.get<ErrorHandler>(ErrorHandler);
  });

  it('should be defined and initialize logger correctly', () => {
    expect(errorHandler).toBeDefined();
    expect(mockLoggerBuilder.build).toHaveBeenCalledWith({
      module: 'ErrorHandler',
    });
  });

  describe('handle', () => {
    const entityName = 'Person';

    it('should throw BadRequestException when error is SequelizeUniqueConstraintError', () => {
      const uniqueError = { name: 'SequelizeUniqueConstraintError' };

      expect(() => errorHandler.handle(uniqueError, entityName)).toThrow(BadRequestException);

      try {
        errorHandler.handle(uniqueError, entityName);
      } catch (error: any) {
        expect(error.getResponse()).toEqual({
          status: ResponseStatus.ERROR,
          details: 'Person with these unique fields already exists.',
        });
      }

      // Логгер не должен вызываться для контролируемых ошибок
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when error is instance of BaseError', () => {
      // Имитируем ошибку Sequelize, наследуемую от BaseError
      const dbError = Object.create(BaseError.prototype);

      expect(() => errorHandler.handle(dbError, entityName)).toThrow(InternalServerErrorException);

      try {
        errorHandler.handle(dbError, entityName);
      } catch (error: any) {
        expect(error.getResponse()).toEqual({
          status: ResponseStatus.ERROR,
          details: 'Internal database error occurred while processing Person.',
        });
      }

      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when error is instance of ValidationErrorItem', () => {
      const validationError = Object.create(ValidationErrorItem.prototype);

      expect(() => errorHandler.handle(validationError, entityName)).toThrow(InternalServerErrorException);

      try {
        errorHandler.handle(validationError, entityName);
      } catch (error: any) {
        expect(error.getResponse()).toEqual({
          status: ResponseStatus.ERROR,
          details: 'Internal database error occurred while processing Person.',
        });
      }

      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should log unexpected error and throw generic InternalServerErrorException', () => {
      const unexpectedError = new Error('Something went runtime wrong');

      expect(() => errorHandler.handle(unexpectedError, entityName)).toThrow(InternalServerErrorException);

      try {
        errorHandler.handle(unexpectedError, entityName);
      } catch (error: any) {
        expect(error.getResponse()).toEqual({
          status: ResponseStatus.ERROR,
          details: 'Internal error',
        });
      }

      // Проверяем факт отправки лога в ELK с правильным текстом и payload
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[ErrorHandler] Unexpected non-database error during Person processing',
        {
          payload: {
            entityName: 'Person',
            error: unexpectedError,
          },
        },
      );
    });
  });

  describe('isDatabaseError', () => {
    it('should return true for BaseError and ValidationErrorItem', () => {
      const dbError = Object.create(BaseError.prototype);
      const validationError = Object.create(ValidationErrorItem.prototype);

      // Используем любой доступ к protected методу в рамках теста
      expect((errorHandler as any).isDatabaseError(dbError)).toBe(true);
      expect((errorHandler as any).isDatabaseError(validationError)).toBe(true);
    });

    it('should return false for generic errors or objects', () => {
      const genericError = new Error('NodeJS Error');
      const simpleObject = { message: 'hello' };

      expect((errorHandler as any).isDatabaseError(genericError)).toBe(false);
      expect((errorHandler as any).isDatabaseError(simpleObject)).toBe(false);
      expect((errorHandler as any).isDatabaseError(null)).toBe(false);
    });
  });
});
