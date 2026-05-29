import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ChannelType, NotificationStatus, NotificationType } from 'src/core/repositories/postgres';
import {
  CreateNotificationPolicyRequestDto,
  UpdateNotificationPolicyRequestDto,
  NotificationPolicyResponseData,
} from './notification-policy.dto'; // Укажите правильный относительный путь

describe('NotificationPolicy DTOs', () => {
  const validCreatePayload = {
    notificationType: '  MARKETING  ', // Проверка trim и lowercase из BaseNotificationFieldsRequestDto
    channelType: '  EmAiL  ', // Проверка trim и lowercase
    regionCode: '  ru  ', // Проверка trim и uppercase из BaseRegionCodeRequestDto
    status: '  1  ', // Проверка приведения строки к числу из BaseNotificationStatusRequestDto
  };

  describe('CreateNotificationPolicyRequestDto', () => {
    it('should successfully validate with valid data and apply inherited transformations', async () => {
      const dto = plainToInstance(CreateNotificationPolicyRequestDto, validCreatePayload);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.notificationType).toBe(NotificationType.MARKETING);
      expect(dto.channelType).toBe(ChannelType.EMAIL);
      expect(dto.regionCode).toBe('RU');
      expect(dto.status).toBe(NotificationStatus.ACTIVE); // Строка '  1  ' должна стать числом 1
    });

    it('should fail validation if inherited required fields are missing', async () => {
      const plain = {
        status: NotificationStatus.ACTIVE,
        // notificationType и channelType отсутствуют
      };
      const dto = plainToInstance(CreateNotificationPolicyRequestDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const targetProperties = errors.map((err) => err.property);
      expect(targetProperties).toContain('notificationType');
      expect(targetProperties).toContain('channelType');
    });

    it('should fail validation if inherited values are out of enum bounds', async () => {
      const plain = {
        ...validCreatePayload,
        channelType: 'fax', // Невалидный канал
        status: 999, // Невалидный статус
      };
      const dto = plainToInstance(CreateNotificationPolicyRequestDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBe(2);
      const targetProperties = errors.map((err) => err.property);
      expect(targetProperties).toContain('channelType');
      expect(targetProperties).toContain('status');
    });
  });

  describe('UpdateNotificationPolicyRequestDto', () => {
    it('should validate successfully when id is correct UUIDv4 and fields are omitted (PartialType)', async () => {
      const plainUpdate = {
        id: '4fa0e21a-e7be-4b95-8df4-069c3a3cfef9',
        // Все остальные поля опущены, так как они опциональны в PartialType
      };

      const dto = plainToInstance(UpdateNotificationPolicyRequestDto, plainUpdate);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.id).toBe('4fa0e21a-e7be-4b95-8df4-069c3a3cfef9');
    });

    it('should fail if id is missing or is not a valid UUIDv4', async () => {
      const plainUpdate = {
        id: 'invalid-uuid-format',
        status: NotificationStatus.DISABLED,
      };

      const dto = plainToInstance(UpdateNotificationPolicyRequestDto, plainUpdate);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('id');
    });

    it('should apply validation rules to fields if they are provided during update', async () => {
      const plainUpdate = {
        id: '4fa0e21a-e7be-4b95-8df4-069c3a3cfef9',
        regionCode: 'RUSSIA', // Ошибка: длина должна быть строго 2 символа
      };

      const dto = plainToInstance(UpdateNotificationPolicyRequestDto, plainUpdate);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('regionCode');
    });
  });

  describe('NotificationPolicyResponseData', () => {
    it('should correctly build response data structure including inherited fields', () => {
      const response = new NotificationPolicyResponseData();
      response.id = 'policy-uuid-777';
      response.regionCode = 'RU';
      response.status = NotificationStatus.ACTIVE;
      response.notificationType = NotificationType.SYSTEM;
      response.channelType = ChannelType.TELEGRAM;

      expect(response.id).toBe('policy-uuid-777');
      expect(response.regionCode).toBe('RU');
      expect(response.status).toBe(NotificationStatus.ACTIVE);
      expect(response.notificationType).toBe(NotificationType.SYSTEM);
      expect(response.channelType).toBe(ChannelType.TELEGRAM);
    });
  });
});
