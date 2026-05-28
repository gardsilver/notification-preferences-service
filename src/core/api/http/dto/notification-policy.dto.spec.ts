/* eslint-disable @typescript-eslint/no-explicit-any */
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateNotificationPolicyRequestDto, UpdateNotificationPolicyRequestDto } from './notification-policy.dto';
import { ChannelType, NotificationStatus, NotificationType } from 'src/core/repositories/postgres';

describe('NotificationPolicy DTOs', () => {
  describe('CreateNotificationPolicyRequestDto', () => {
    const validPlainObject = {
      status: NotificationStatus.ACTIVE,
      notificationType: NotificationType.MARKETING,
      channelType: ChannelType.EMAIL,
      regionCode: 'RU',
    };

    it('should successfully validate with valid data', async () => {
      const dtoInstance = plainToInstance(CreateNotificationPolicyRequestDto, validPlainObject);
      const errors = await validate(dtoInstance);

      expect(errors.length).toBe(0);
    });

    describe('Transformations (trim and casing)', () => {
      it('should lowercase and trim notificationType/status', async () => {
        const dto = plainToInstance(CreateNotificationPolicyRequestDto, {
          ...validPlainObject,
          status: ' ACTIVE ',
        });

        await validate(dto);

        expect(dto.notificationType).toBe('marketing');
        expect(dto.status).toBe('active');
      });

      it('should trim and lowercase notificationType and channelType, and uppercase regionCode', async () => {
        const plain = {
          status: NotificationStatus.ACTIVE,
          notificationType: '  MARKETING  ',
          channelType: '  EmAiL  ',
          regionCode: '  ru  ',
        };

        const dtoInstance: any = plainToInstance(CreateNotificationPolicyRequestDto, plain);
        const errors = await validate(dtoInstance);

        expect(errors.length).toBe(0);
        expect(dtoInstance.notificationType).toBe('marketing');
        expect(dtoInstance.channelType).toBe('email');
        expect(dtoInstance.regionCode).toBe('RU');
      });
    });

    describe('Validation Constraints', () => {
      it('should fail if notificationType or channelType or regionCode are missing', async () => {
        const plain = {
          status: NotificationStatus.ACTIVE,
          // notificationType, channelType, regionCode отсутствуют
        };

        const dtoInstance = plainToInstance(CreateNotificationPolicyRequestDto, plain);
        const errors = await validate(dtoInstance);

        expect(errors.length).toBeGreaterThan(0);

        const targetProperties = errors.map((err) => err.property);
        expect(targetProperties).toContain('notificationType');
        expect(targetProperties).toContain('channelType');
        expect(targetProperties).toContain('regionCode');
      });

      it('should fail validation with invalid status value', async () => {
        const plain = {
          ...validPlainObject,
          status: 999, // Неверное значение enum
        };

        const dtoInstance = plainToInstance(CreateNotificationPolicyRequestDto, plain);
        const errors = await validate(dtoInstance);

        expect(errors.length).toBe(1);
        expect(errors[0].property).toBe('status');
        expect(errors[0].constraints?.isIn).toContain('Указан неверный статус политики. Допустимые значения: 0, 1');
      });

      it('should fail validation with invalid notificationType value', async () => {
        const plain = {
          ...validPlainObject,
          notificationType: 'invalid-type',
        };

        const dtoInstance = plainToInstance(CreateNotificationPolicyRequestDto, plain);
        const errors = await validate(dtoInstance);

        expect(errors.length).toBe(1);
        expect(errors[0].property).toBe('notificationType');
        expect(errors[0].constraints?.isIn).toContain('Указан неверный информационный канал.');
      });

      it('should fail validation with invalid channelType value', async () => {
        const plain = {
          ...validPlainObject,
          channelType: 'fax',
        };

        const dtoInstance = plainToInstance(CreateNotificationPolicyRequestDto, plain);
        const errors = await validate(dtoInstance);

        expect(errors.length).toBe(1);
        expect(errors[0].property).toBe('channelType');
        expect(errors[0].constraints?.isIn).toContain('Указан неверный тип канала оповещения.');
      });

      it('should fail validation if regionCode length is not exactly 2 characters', async () => {
        const plainShort = { ...validPlainObject, regionCode: 'R' };
        const plainLong = { ...validPlainObject, regionCode: 'RUS' };

        const dtoInstanceShort = plainToInstance(CreateNotificationPolicyRequestDto, plainShort);
        const errorsShort = await validate(dtoInstanceShort);
        expect(errorsShort.map((e) => e.property)).toContain('regionCode');

        const dtoInstanceLong = plainToInstance(CreateNotificationPolicyRequestDto, plainLong);
        const errorsLong = await validate(dtoInstanceLong);
        expect(errorsLong.map((e) => e.property)).toContain('regionCode');
      });
    });
  });

  describe('UpdateNotificationPolicyRequestDto', () => {
    it('should validate successfully when id is correct UUIDv4 and fields are optional', async () => {
      const plain = {
        id: '4fa0e21a-e7be-4b95-8df4-069c3a3cfef9', // Валидный UUID
        notificationType: NotificationType.SYSTEM,
        // Остальные поля опущены, так как это PartialType
      };

      const dtoInstance = plainToInstance(UpdateNotificationPolicyRequestDto, plain);
      const errors = await validate(dtoInstance);

      expect(errors.length).toBe(0);
    });

    it('should fail if id is missing', async () => {
      const plain = {
        notificationType: NotificationType.SYSTEM,
      };

      const dtoInstance = plainToInstance(UpdateNotificationPolicyRequestDto, plain);
      const errors = await validate(dtoInstance);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('id');
    });

    it('should fail if id is not a valid UUIDv4', async () => {
      const plain = {
        id: 'invalid-uuid-12345',
      };

      const dtoInstance = plainToInstance(UpdateNotificationPolicyRequestDto, plain);
      const errors = await validate(dtoInstance);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('id');
    });
  });
});
