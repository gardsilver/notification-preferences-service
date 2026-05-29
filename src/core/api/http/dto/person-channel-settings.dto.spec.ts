/* eslint-disable @typescript-eslint/no-explicit-any */
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { NotificationStatus, NotificationType } from 'src/core/repositories/postgres';
import {
  ChannelSettingsRequestData,
  UpdateChannelSettingsRequestData,
  ChannelSettingsResponseData,
} from './person-channel-settings.dto'; // Укажите правильный относительный путь

// Заменяем реальный хелпер времени на мок
jest.mock('src/core/app', () => ({
  DatetimeHelper: {
    timeToMinutes: jest.fn((time: string) => {
      if (time === '22:00') return 1320;
      if (time === '08:00') return 480;
      return 0;
    }),
  },
}));

describe('ChannelSettings DTOs', () => {
  const validCreatePayload = {
    type: '  MARKETING  ', // Проверяем trim().toLowerCase() из родительского DTO
    status: '  1  ', // Проверяем приведение строкового числа к number
    quietRanges: {
      quietStart: '22:00',
      quietFinish: '08:00',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ChannelSettingsRequestData', () => {
    it('should successfully validate with valid data and apply nested/inherited transformations', async () => {
      const dto = plainToInstance(ChannelSettingsRequestData, validCreatePayload);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.type).toBe(NotificationType.MARKETING);
      expect(dto.status).toBe(NotificationStatus.ACTIVE); // Строка '  1  ' превратилась в число 1
      expect(dto.quietRanges.quietStart).toBe(1320);
    });

    it('should fail validation if inherited required fields are missing', async () => {
      const plain = {
        status: NotificationStatus.ACTIVE,
        // type и quietRanges отсутствуют
      };
      const dto = plainToInstance(ChannelSettingsRequestData, plain);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const targetProperties = errors.map((err) => err.property);
      expect(targetProperties).toContain('type');
      expect(targetProperties).toContain('quietRanges');
    });

    it('should fail validation with invalid status value', async () => {
      const plain = {
        ...validCreatePayload,
        status: 'invalid_status_string',
      };
      const dto = plainToInstance(ChannelSettingsRequestData, plain);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('status');
    });
  });

  describe('UpdateChannelSettingsRequestData', () => {
    it('should validate successfully when all fields are omitted (PartialType behavior)', async () => {
      const plainUpdate = {}; // В PATCH-запросе можно не передавать ничего

      const dto = plainToInstance(UpdateChannelSettingsRequestData, plainUpdate);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should apply validation rules to primitive fields if they are provided', async () => {
      const plainUpdate = {
        type: 'invalid-notification-type',
      };

      const dto = plainToInstance(UpdateChannelSettingsRequestData, plainUpdate);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('type');
    });

    it('should recursively validate quietRanges if it is provided during update', async () => {
      const plainUpdate = {
        quietRanges: {
          quietStart: 'invalid-time-format', // Должно быть HH:mm
        },
      };

      const dto = plainToInstance(UpdateChannelSettingsRequestData, plainUpdate);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('quietRanges');
      expect(errors[0].children?.length).toBeGreaterThan(0);
    });
  });

  describe('ChannelSettingsResponseData', () => {
    it('should correctly build response data structure and NOT contain id field', () => {
      const response = new ChannelSettingsResponseData();
      response.status = NotificationStatus.ACTIVE;
      response.type = NotificationType.SYSTEM;
      response.quietRanges = { quietStart: '22:00', quietFinish: '08:00' };

      expect(response.status).toBe(NotificationStatus.ACTIVE);
      expect(response.type).toBe(NotificationType.SYSTEM);
      expect(response.quietRanges.quietStart).toBe('22:00');

      // Проверяем, что OmitType убрал поле id из родительского NotificationDefaultSettingsResponseData
      expect((response as any).id).toBeUndefined();
      expect(response).not.toHaveProperty('id');
    });
  });
});
