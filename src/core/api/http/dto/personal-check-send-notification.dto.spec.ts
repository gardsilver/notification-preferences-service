import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PersonalCheckSendNotificationRequestDto } from './personal-check-send-notification.dto';
import { ChannelType, NotificationType } from 'src/core/repositories/postgres';

describe('PersonalCheckSendNotification', () => {
  const validPayload = {
    personId: '00000000-0000-0000-0000-000000000000',
    notificationType: 'marketing',
    channelType: 'email',
    regionCode: 'ru',
    datetime: '2026-05-21T21:30:00Z',
  };

  it('should validate correct payload', async () => {
    const dto = plainToInstance(PersonalCheckSendNotificationRequestDto, validPayload);

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should transform datetime to ISO string', async () => {
    const dto = plainToInstance(PersonalCheckSendNotificationRequestDto, {
      ...validPayload,
      datetime: '2026-05-21T21:30:00.000Z',
    });

    expect(dto.datetime).toBe('2026-05-21T21:30:00.000Z');
  });

  it('should fail for invalid datetime', async () => {
    const dto = plainToInstance(PersonalCheckSendNotificationRequestDto, {
      ...validPayload,
      datetime: 'invalid-date',
    });

    const errors = await validate(dto);

    expect(errors).not.toHaveLength(0);

    const datetimeError = errors.find((e) => e.property === 'datetime');

    expect(datetimeError?.constraints?.isDateString).toBeDefined();
  });

  it('should trim and lowercase notificationType', () => {
    const dto = plainToInstance(PersonalCheckSendNotificationRequestDto, {
      ...validPayload,
      notificationType: ' SYSTEM ',
    });

    expect(dto.notificationType).toBe(NotificationType.SYSTEM);
  });

  it('should trim and lowercase channelType', () => {
    const dto = plainToInstance(PersonalCheckSendNotificationRequestDto, {
      ...validPayload,
      channelType: ' EMAIL ',
    });

    expect(dto.channelType).toBe(ChannelType.EMAIL);
  });

  it('should trim and uppercase regionCode', () => {
    const dto = plainToInstance(PersonalCheckSendNotificationRequestDto, {
      ...validPayload,
      regionCode: ' ru ',
    });

    expect(dto.regionCode).toBe('RU');
  });

  it('should trim personId', () => {
    const dto = plainToInstance(PersonalCheckSendNotificationRequestDto, {
      ...validPayload,
      personId: ' 00000000-0000-0000-0000-000000000000 ',
    });

    expect(dto.personId).toBe('00000000-0000-0000-0000-000000000000');
  });

  it('should fail for invalid UUID', async () => {
    const dto = plainToInstance(PersonalCheckSendNotificationRequestDto, {
      ...validPayload,
      personId: 'invalid-uuid',
    });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'personId')).toBe(true);
  });

  it('should fail for invalid notificationType', async () => {
    const dto = plainToInstance(PersonalCheckSendNotificationRequestDto, {
      ...validPayload,
      notificationType: 'invalid',
    });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'notificationType')).toBe(true);
  });

  it('should fail for invalid channelType', async () => {
    const dto = plainToInstance(PersonalCheckSendNotificationRequestDto, {
      ...validPayload,
      channelType: 'invalid',
    });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'channelType')).toBe(true);
  });

  it('should fail for invalid regionCode length', async () => {
    const dto = plainToInstance(PersonalCheckSendNotificationRequestDto, {
      ...validPayload,
      regionCode: 'RUS',
    });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'regionCode')).toBe(true);
  });
});
