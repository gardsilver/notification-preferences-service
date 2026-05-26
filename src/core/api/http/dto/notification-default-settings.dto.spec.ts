import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateNotificationDefaultSettingsRequestDto,
  UpdateNotificationDefaultSettingsRequestDto,
} from './notification-default-settings.dto';
import { NotificationType } from 'src/core/repositories/postgres';

describe('NotificationDefaultSettings DTO validation', () => {
  describe('Create DTO', () => {
    it('should transform type to lowercase and pass validation', async () => {
      const dto = plainToInstance(CreateNotificationDefaultSettingsRequestDto, {
        type: 'SYSTEM',
        quietStart: '22:00',
        quietFinish: '08:00',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.type).toBe('system');
    });

    it('should fail if type is invalid', async () => {
      const dto = plainToInstance(CreateNotificationDefaultSettingsRequestDto, {
        type: 'INVALID_TYPE',
        quietStart: '22:00',
        quietFinish: '08:00',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should transform HH:mm to minutes', async () => {
      const dto = plainToInstance(CreateNotificationDefaultSettingsRequestDto, {
        type: NotificationType.SYSTEM,
        quietStart: '01:00',
        quietFinish: '02:30',
      });

      await validate(dto);

      expect(dto.quietStart).toBe(60);
      expect(dto.quietFinish).toBe(150);
    });

    it('should fail when quietStart is missing but quietFinish exists (ValidateIf)', async () => {
      const dto = plainToInstance(CreateNotificationDefaultSettingsRequestDto, {
        type: NotificationType.SYSTEM,
        quietFinish: '08:00',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail Min/Max validation', async () => {
      const dto = plainToInstance(CreateNotificationDefaultSettingsRequestDto, {
        type: NotificationType.SYSTEM,
        quietStart: -10,
        quietFinish: 99999,
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Update DTO', () => {
    it('should validate UUID id', async () => {
      const dto = plainToInstance(UpdateNotificationDefaultSettingsRequestDto, {
        id: 'not-a-uuid',
        type: NotificationType.SYSTEM,
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should pass valid update DTO', async () => {
      const dto = plainToInstance(UpdateNotificationDefaultSettingsRequestDto, {
        id: '00000000-0000-0000-0000-000000000000',
        type: NotificationType.SYSTEM,
        quietStart: '10:00',
        quietFinish: '18:00',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should allow partial update (no quiet fields)', async () => {
      const dto = plainToInstance(UpdateNotificationDefaultSettingsRequestDto, {
        id: '00000000-0000-0000-0000-000000000000',
        type: NotificationType.SYSTEM,
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should trim id', async () => {
      const dto = plainToInstance(UpdateNotificationDefaultSettingsRequestDto, {
        id: ' 00000000-0000-0000-0000-000000000000 ',
        type: NotificationType.SYSTEM,
      });

      await validate(dto);

      expect(dto.id).toBe('00000000-0000-0000-0000-000000000000');
    });
  });
});
