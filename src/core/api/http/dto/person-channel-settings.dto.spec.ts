import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { NotificationType, NotificationStatus } from 'src/core/repositories/postgres';
import { ChannelSettingsRequestData, QuietRangesRequestData } from './person-channel-settings.dto';

describe('ChannelSettings DTO validation', () => {
  describe('QuietRangesRequestData', () => {
    it('should transform HH:mm to minutes', async () => {
      const dto = plainToInstance(QuietRangesRequestData, {
        quietStart: '01:00',
        quietFinish: '02:30',
      });

      await validate(dto);

      expect(dto.quietStart).toBe(60);
      expect(dto.quietFinish).toBe(150);
    });

    it('should validate Min/Max boundaries', async () => {
      const dto = plainToInstance(QuietRangesRequestData, {
        quietStart: -1,
        quietFinish: 999999,
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail when only quietFinish provided (ValidateIf rule)', async () => {
      const dto = plainToInstance(QuietRangesRequestData, {
        quietFinish: '08:00',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail when only quietStart provided (ValidateIf rule)', async () => {
      const dto = plainToInstance(QuietRangesRequestData, {
        quietStart: '22:00',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should pass valid quiet range', async () => {
      const dto = plainToInstance(QuietRangesRequestData, {
        quietStart: '22:00',
        quietFinish: '08:00',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });
  });

  describe('ChannelSettingsRequestData', () => {
    it('should lowercase and trim type/status', async () => {
      const dto = plainToInstance(ChannelSettingsRequestData, {
        type: ' SYSTEM ',
        status: ' ACTIVE ',
        quietRanges: {
          quietStart: '10:00',
          quietFinish: '12:00',
        },
      });

      await validate(dto);

      expect(dto.type).toBe('system');
      expect(dto.status).toBe('active');
    });

    it('should fail if type is invalid', async () => {
      const dto = plainToInstance(ChannelSettingsRequestData, {
        type: 'INVALID',
        quietRanges: {
          quietStart: '10:00',
          quietFinish: '12:00',
        },
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate nested quietRanges (ValidateNested)', async () => {
      const dto = plainToInstance(ChannelSettingsRequestData, {
        type: NotificationType.SYSTEM,
        status: NotificationStatus.ACTIVE,
        quietRanges: {
          quietStart: '01:00',
          quietFinish: '02:00',
        },
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.quietRanges.quietStart).toBe(60);
    });

    it('should fail if quietRanges is invalid', async () => {
      const dto = plainToInstance(ChannelSettingsRequestData, {
        type: NotificationType.SYSTEM,
        status: NotificationStatus.ACTIVE,
        quietRanges: {
          quietStart: -10,
          quietFinish: 999999,
        },
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should allow optional status', async () => {
      const dto = plainToInstance(ChannelSettingsRequestData, {
        type: NotificationType.SYSTEM,
        quietRanges: {
          quietStart: '10:00',
          quietFinish: '11:00',
        },
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });
  });
});
