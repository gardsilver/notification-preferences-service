import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { NotificationType } from 'src/core/repositories/postgres';
import {
  CreateNotificationDefaultSettingsRequestDto,
  UpdateNotificationDefaultSettingsRequestDto,
  NotificationDefaultSettingsResponseData,
} from './notification-default-settings.dto'; // Укажите правильный относительный путь

// Заменяем хелпер времени на мок для изоляции тестов от логики парсинга времени
jest.mock('src/core/app', () => ({
  DatetimeHelper: {
    timeToMinutes: jest.fn((time: string) => {
      if (time === '22:00') return 1320;
      if (time === '08:00') return 480;
      return 0;
    }),
  },
}));

describe('NotificationDefaultSettings DTOs', () => {
  const validCreatePayload = {
    type: '  MARKETING  ', // Имитируем небрежный ввод для проверки trim/lowercase
    quietRanges: {
      quietStart: '22:00',
      quietFinish: '08:00',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CreateNotificationDefaultSettingsRequestDto', () => {
    it('should successfully validate with valid data and apply transformations', async () => {
      const dto = plainToInstance(CreateNotificationDefaultSettingsRequestDto, validCreatePayload);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.type).toBe(NotificationType.MARKETING); // Проверяем trim().toLowerCase()
      expect(dto.quietRanges.quietStart).toBe(1320); // Проверяем вложенную трансформацию времени
    });

    it('should fail validation if type is missing or invalid', async () => {
      const plain = {
        ...validCreatePayload,
        type: 'invalid-channel-type',
      };
      const dto = plainToInstance(CreateNotificationDefaultSettingsRequestDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('type');
      expect(errors[0].constraints?.isIn).toContain('Указан неверный информационный канал');
    });

    it('should pass non-string values as-is without crashing in @Transform', async () => {
      const plain = {
        ...validCreatePayload,
        type: null,
      };
      const dto = plainToInstance(CreateNotificationDefaultSettingsRequestDto, plain);
      const errors = await validate(dto);

      expect(dto.type).toBeNull();
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateNotificationDefaultSettingsRequestDto', () => {
    it('should validate successfully when id is correct and properties are omitted (PartialType)', async () => {
      const plainUpdate = {
        id: '4fa0e21a-e7be-4b95-8df4-069c3a3cfef9',
        // Все остальные поля пропущены, так как это PATCH-модель
      };

      const dto = plainToInstance(UpdateNotificationDefaultSettingsRequestDto, plainUpdate);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.id).toBe('4fa0e21a-e7be-4b95-8df4-069c3a3cfef9');
    });

    it('should fail if id is missing or not a valid UUIDv4', async () => {
      const plainUpdate = {
        id: 'not-a-valid-uuid',
        type: NotificationType.SYSTEM,
      };

      const dto = plainToInstance(UpdateNotificationDefaultSettingsRequestDto, plainUpdate);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('id');
    });

    it('should apply nested validation if quietRanges is partially provided during update', async () => {
      const plainUpdate = {
        id: '4fa0e21a-e7be-4b95-8df4-069c3a3cfef9',
        quietRanges: {
          quietStart: 'invalid-time-format',
        },
      };

      const dto = plainToInstance(UpdateNotificationDefaultSettingsRequestDto, plainUpdate);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('quietRanges');
      expect(errors[0].children?.length).toBeGreaterThan(0);
    });
  });

  describe('NotificationDefaultSettingsResponseData', () => {
    it('should correctly build response data structure', () => {
      const response = new NotificationDefaultSettingsResponseData();
      response.id = 'uuid-123';
      response.type = NotificationType.SYSTEM;
      response.quietRanges = { quietStart: '22:00', quietFinish: '08:00' };

      expect(response.id).toBe('uuid-123');
      expect(response.type).toBe(NotificationType.SYSTEM);
      expect(response.quietRanges.quietStart).toBe('22:00');
    });
  });
});
