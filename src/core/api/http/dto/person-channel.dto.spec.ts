import { validate, useContainer } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { Test } from '@nestjs/testing';
import {
  ChannelType,
  PersonChannelStatus,
  NotificationType,
  NotificationStatus,
  PersonService,
} from 'src/core/repositories/postgres';
import { CreatePersonChannelRequestDto, UpdatePersonChannelRequestData } from './person-channel.dto';
import { IsChannelValueValidConstraint } from '../validators/person-channel.validator';

describe('PersonChannel DTO validation', () => {
  const baseValidCreate = {
    label: ' Work ',
    status: PersonChannelStatus.ACTIVE,
    isVerified: 'true',
    type: ChannelType.EMAIL,
    value: 'USER@EXAMPLE.COM',
    settings: [
      {
        type: NotificationType.SYSTEM,
        status: NotificationStatus.ACTIVE,
        quietRanges: {
          quietStart: '22:00',
          quietFinish: '08:00',
        },
      },
    ],
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
  });

  it('should validate valid CreatePersonChannelRequestDto', async () => {
    const dto = plainToInstance(CreatePersonChannelRequestDto, baseValidCreate);

    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should fail when status is invalid', async () => {
    const dto = plainToInstance(CreatePersonChannelRequestDto, {
      ...baseValidCreate,
      status: 'INVALID_STATUS',
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should transform isVerified from string to boolean', async () => {
    const dto = plainToInstance(CreatePersonChannelRequestDto, {
      ...baseValidCreate,
      isVerified: 'false',
    });

    await validate(dto);

    expect(dto.isVerified).toBe(false);
  });

  it('should transform value to lowercase', async () => {
    const dto = plainToInstance(CreatePersonChannelRequestDto, {
      ...baseValidCreate,
      value: 'USER@EXAMPLE.COM',
    });

    await validate(dto);

    expect(dto.value).toBe('user@example.com');
  });

  it('should validate nested settings (invalid enum)', async () => {
    const dto = plainToInstance(CreatePersonChannelRequestDto, {
      ...baseValidCreate,
      settings: [
        {
          type: 'WRONG_TYPE',
          status: NotificationStatus.ACTIVE,
        },
      ],
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when UUID is invalid in update DTO', async () => {
    const dto = plainToInstance(UpdatePersonChannelRequestData, {
      id: 'not-uuid',
      value: 'user@example.com',
    });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'id')).toBe(true);
  });

  it('should validate UpdatePersonChannelRequestData partially', async () => {
    const dto = plainToInstance(UpdatePersonChannelRequestData, {
      id: '00000000-0000-0000-0000-000000000000',
      value: 'user@example.com',
      status: PersonChannelStatus.ACTIVE,
    });

    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });
});
