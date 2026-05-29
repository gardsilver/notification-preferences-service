import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  PersonalCheckSendNotificationRequestDto,
  PersonalCheckSendNotificationResponseData,
} from './personal-check-send-notification.dto'; // Укажите правильный относительный путь
import { ChannelType, NotificationType } from 'src/core/repositories/postgres';

describe('PersonalCheckSendNotification DTOs', () => {
  const validPayload = {
    personId: '  4fa0e21a-e7be-4b95-8df4-069c3a3cfef9  ', // Проверяем trim()
    notificationType: '  MARKETING  ', // Из базового BaseNotificationFieldsRequestDto
    channelType: '  EmAiL  ', // Из базового BaseNotificationFieldsRequestDto
    regionCode: '  ru  ', // Из базового BaseNotificationFieldsRequestDto
    datetime: '  2026-05-21 21:30:00  ', // Небрежная дата для проверки приведения к ISO
  };

  describe('PersonalCheckSendNotificationRequestDto', () => {
    it('should successfully validate with valid data and apply all transformations', async () => {
      const dto = plainToInstance(PersonalCheckSendNotificationRequestDto, validPayload);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.personId).toBe('4fa0e21a-e7be-4b95-8df4-069c3a3cfef9');
      expect(dto.notificationType).toBe(NotificationType.MARKETING);
      expect(dto.channelType).toBe(ChannelType.EMAIL);
      expect(dto.regionCode).toBe('RU');

      // Проверяем работу трансформера datetime (должен преобразовать в ISO UTC)
      expect(dto.datetime).toBe(new Date('2026-05-21 21:30:00').toISOString());
    });

    it('should return value as-is inside datetime transformer if input is not a string', async () => {
      const plain = {
        ...validPayload,
        datetime: 123456789, // Передаем число вместо строки
      };

      const dto = plainToInstance(PersonalCheckSendNotificationRequestDto, plain);
      const errors = await validate(dto);

      expect(dto.datetime).toBe(123456789);
      expect(errors.length).toBeGreaterThan(0); // Должно упасть на @IsString
    });

    it('should return trimmed text inside datetime transformer if date is completely invalid', async () => {
      const plain = {
        ...validPayload,
        datetime: '  completely-invalid-date-string  ',
      };

      const dto = plainToInstance(PersonalCheckSendNotificationRequestDto, plain);
      const errors = await validate(dto);

      expect(dto.datetime).toBe('completely-invalid-date-string'); // Должен вернуть строку без изменений (но с trim)
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('datetime');
      expect(errors[0].constraints?.isDateString).toContain('datetime должен быть валидной UTC ISO датой');
    });

    it('should fail validation if mandatory fields are missing', async () => {
      const plain = {
        regionCode: 'RU',
      };

      const dto = plainToInstance(PersonalCheckSendNotificationRequestDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const targetProperties = errors.map((err) => err.property);
      expect(targetProperties).toContain('personId');
      expect(targetProperties).toContain('notificationType');
      expect(targetProperties).toContain('channelType');
      expect(targetProperties).toContain('datetime');
    });

    it('should fail validation if personId is not a valid UUIDv4', async () => {
      const plain = {
        ...validPayload,
        personId: 'not-a-valid-uuid',
      };

      const dto = plainToInstance(PersonalCheckSendNotificationRequestDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('personId');
    });
  });

  describe('PersonalCheckSendNotificationResponseData', () => {
    it('should correctly build response data structure', () => {
      const response = new PersonalCheckSendNotificationResponseData();
      response.channelIds = ['ch-uuid-1', 'ch-uuid-2'];

      expect(response.channelIds).toEqual(['ch-uuid-1', 'ch-uuid-2']);
    });
  });
});
