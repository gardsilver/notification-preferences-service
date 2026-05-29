import { validate, useContainer } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { Test } from '@nestjs/testing';
import { ChannelType, PersonChannelStatus, PersonService } from 'src/core/repositories/postgres';
import { IsChannelValueValidConstraint } from '../validators/person-channel.validator';
import {
  CreatePersonChannelRequestDto,
  UpdatePersonChannelRequestData,
  PersonChannelResponseData,
} from './person-channel.dto'; // Укажите правильный относительный путь

describe('PersonChannel DTOs', () => {
  const validCreatePayload = {
    label: '  Рабочий  ',
    status: '  1  ', // Строковый числовой enum для проверки Number()
    isVerified: 'true', // Строковое булево значение для проверки трансформации
    type: '  EmAiL  ',
    value: '  USER@EXAMPLE.COM  ',
    settings: [],
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        {
          provide: PersonService,
          useValue: {
            isChannelExist: jest.fn().mockResolvedValue(false),
          },
        },
        IsChannelValueValidConstraint,
      ],
    }).compile();

    useContainer(module, { fallbackOnErrors: true, fallback: true });

    jest.clearAllMocks();
  });

  describe('CreatePersonChannelRequestDto', () => {
    it('should successfully validate with valid data and apply transformations', async () => {
      const dto = plainToInstance(CreatePersonChannelRequestDto, validCreatePayload);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.label).toBe('Рабочий');
      expect(dto.status).toBe(PersonChannelStatus.ACTIVE); // Ожидаем число 1
      expect(dto.isVerified).toBe(true); // Ожидаем boolean true
      expect(dto.type).toBe(ChannelType.EMAIL);
      expect(dto.value).toBe('user@example.com');
    });

    it('should handle false values correctly inside isVerified transformer', async () => {
      const dto = plainToInstance(CreatePersonChannelRequestDto, {
        ...validCreatePayload,
        isVerified: 'false',
      });
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.isVerified).toBe(false);
    });

    it('should pass non-string values as-is without crashing inside transformers', async () => {
      const plain = {
        ...validCreatePayload,
        label: null,
        status: PersonChannelStatus.BLOCKED,
        isVerified: false,
      };
      const dto = plainToInstance(CreatePersonChannelRequestDto, plain);
      const errors = await validate(dto);

      expect(dto.label).toBeNull();
      expect(dto.status).toBe(PersonChannelStatus.BLOCKED);
      expect(dto.isVerified).toBe(false);
      expect(errors.length).toBe(0);
    });

    it('should fail validation if mandatory fields are missing', async () => {
      const plain = {
        label: 'Home',
        // status, isVerified, type, value отсутствуют
      };
      const dto = plainToInstance(CreatePersonChannelRequestDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const properties = errors.map((err) => err.property);
      expect(properties).toContain('status');
      expect(properties).toContain('isVerified');
      expect(properties).toContain('type');
      expect(properties).toContain('value');
    });

    it('should fail validation if status or type fields contain invalid values', async () => {
      const plain = {
        ...validCreatePayload,
        status: 999, // Неверный статус
        type: 'invalid-channel', // Неверный тип
      };
      const dto = plainToInstance(CreatePersonChannelRequestDto, plain);
      const errors = await validate(dto);

      // ИСПРАВЛЕНИЕ: Проверяем, что ошибки зафиксированы, вместо жесткой привязки к числу 2
      expect(errors.length).toBeGreaterThan(0);

      const properties = errors.map((err) => err.property);
      expect(properties).toContain('status');
      expect(properties).toContain('type');
    });

    it('should fail validation if isVerified is not a boolean', async () => {
      const plain = {
        ...validCreatePayload,
        isVerified: 'not-a-boolean-string',
      };
      const dto = plainToInstance(CreatePersonChannelRequestDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('isVerified');
    });
  });

  describe('UpdatePersonChannelRequestData', () => {
    it('should validate successfully when all fields are optional during update', async () => {
      const plainUpdate = {
        id: '4fa0e21a-e7be-4b95-8df4-069c3a3cfef9', // Передаем только ID
      };

      const dto = plainToInstance(UpdatePersonChannelRequestData, plainUpdate);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.id).toBe('4fa0e21a-e7be-4b95-8df4-069c3a3cfef9');
    });

    it('should fail validation if an invalid UUID format is provided for id', async () => {
      const plainUpdate = {
        id: 'invalid-uuid-format',
      };

      const dto = plainToInstance(UpdatePersonChannelRequestData, plainUpdate);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('id');
    });

    it('should deeply validate nested settings array if provided during update', async () => {
      const plainUpdate = {
        settings: [
          {
            type: 'invalid-notification-type', // Должно вызвать ошибку вложенного DTO
          },
        ],
      };

      const dto = plainToInstance(UpdatePersonChannelRequestData, plainUpdate);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('settings');
      expect(errors[0].children?.length).toBeGreaterThan(0);
    });
  });

  describe('PersonChannelResponseData', () => {
    it('should correctly build response data structure using inherited fields', () => {
      const response = new PersonChannelResponseData();
      response.id = 'channel-uuid-111';
      response.label = 'Рабочий';
      response.status = PersonChannelStatus.ACTIVE;
      response.isVerified = true;
      response.type = ChannelType.EMAIL;
      response.value = 'user@example.com';
      response.settings = [];

      expect(response.id).toBe('channel-uuid-111');
      expect(response.label).toBe('Рабочий');
      expect(response.status).toBe(PersonChannelStatus.ACTIVE);
      expect(response.isVerified).toBe(true);
      expect(response.type).toBe(ChannelType.EMAIL);
      expect(response.value).toBe('user@example.com');
      expect(response.settings).toEqual([]);
    });
  });
});
