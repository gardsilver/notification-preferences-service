import { validate, useContainer } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { Test } from '@nestjs/testing';
import { ChannelType, PersonChannelStatus, PersonService } from 'src/core/repositories/postgres';
import { IsChannelValueValidConstraint } from '../validators/person-channel.validator';
import { CreatePersonRequestDto, UpdatePersonRequestDto } from './person.dto';

describe('CreatePersonRequestDto', () => {
  const baseValid = {
    firstName: ' Иван ',
    lastName: ' Иванов ',
    birthday: '1990-01-01',
    regionCode: 'ru',
    timezone: 'Europe/Moscow',
    channels: [
      {
        status: PersonChannelStatus.ACTIVE,
        isVerified: true,
        type: ChannelType.EMAIL,
        value: 'TEST@MAIL.COM',
        settings: [],
      },
    ],
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        IsChannelValueValidConstraint,
        {
          provide: PersonService,
          useValue: {
            isChannelExist: jest.fn().mockResolvedValue(false),
          },
        },
      ],
    }).compile();

    useContainer(module, { fallbackOnErrors: true });
  });

  it('should validate correct payload', async () => {
    const dto = plainToInstance(CreatePersonRequestDto, baseValid);

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.length).toBe(0);
  });

  it('should trim names and normalize regionCode', async () => {
    const dto = plainToInstance(CreatePersonRequestDto, baseValid);

    await validate(dto);

    expect(dto.firstName).toBe('Иван');
    expect(dto.lastName).toBe('Иванов');
    expect(dto.regionCode).toBe('RU');
  });

  it('should fail when channels is not array', async () => {
    const dto = plainToInstance(CreatePersonRequestDto, {
      ...baseValid,
      channels: {},
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail nested channel validation', async () => {
    const dto = plainToInstance(CreatePersonRequestDto, {
      ...baseValid,
      channels: [
        {
          status: 'BAD_STATUS',
          type: ChannelType.EMAIL,
          value: 'not-email',
          isVerified: 'maybe',
        },
      ],
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail missing required fields', async () => {
    const dto = plainToInstance(CreatePersonRequestDto, {
      lastName: 'Ivanov',
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should normalize timezone and regionCode', async () => {
    const dto = plainToInstance(CreatePersonRequestDto, {
      ...baseValid,
      timezone: ' Europe/Moscow ',
      regionCode: 'us',
    });

    await validate(dto);

    expect(dto.timezone).toBe('Europe/Moscow');
    expect(dto.regionCode).toBe('US');
  });

  it('should allow empty channels array', async () => {
    const dto = plainToInstance(CreatePersonRequestDto, {
      ...baseValid,
      channels: [],
    });

    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });
});

describe('UpdatePersonRequestDto', () => {
  const baseValid = {
    id: '00000000-0000-0000-0000-000000000000',
    firstName: ' Иван ',
    lastName: ' Иванов ',
    channels: [
      {
        id: '00000000-0000-0000-0000-000000000000',
        status: PersonChannelStatus.ACTIVE,
        type: ChannelType.EMAIL,
        value: 'test@mail.com',
      },
    ],
  };

  it('should validate minimal valid update', async () => {
    const dto = plainToInstance(UpdatePersonRequestDto, baseValid);

    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should allow partial update (no required fields except id)', async () => {
    const dto = plainToInstance(UpdatePersonRequestDto, {
      id: baseValid.id,
    });

    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should fail if id is not uuid', async () => {
    const dto = plainToInstance(UpdatePersonRequestDto, {
      id: 'not-uuid',
    });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'id')).toBe(true);
  });

  it('should validate nested channels only when present', async () => {
    const dto = plainToInstance(UpdatePersonRequestDto, {
      id: baseValid.id,
      channels: [
        {
          status: 'INVALID',
          type: ChannelType.EMAIL,
          value: 'bad',
        },
      ],
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should not fail when optional fields are missing entirely', async () => {
    const dto = plainToInstance(UpdatePersonRequestDto, {
      id: '00000000-0000-0000-0000-000000000000',
    });

    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should validate only id present', async () => {
    const dto = plainToInstance(UpdatePersonRequestDto, {
      id: '00000000-0000-0000-0000-000000000000',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should ignore undefined optional fields', async () => {
    const dto = plainToInstance(UpdatePersonRequestDto, {
      id: '00000000-0000-0000-0000-000000000000',
      firstName: undefined,
      lastName: undefined,
      timezone: undefined,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should fail invalid regionCode length', async () => {
    const dto = plainToInstance(UpdatePersonRequestDto, {
      id: '00000000-0000-0000-0000-000000000000',
      regionCode: 'RUS',
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });
});
