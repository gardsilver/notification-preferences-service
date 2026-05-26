/* eslint-disable @typescript-eslint/no-explicit-any */
import { validate, ValidationArguments, useContainer } from 'class-validator';
import { Test, TestingModule } from '@nestjs/testing';
import { ChannelType } from 'src/core/repositories/postgres';
import { PersonService } from 'src/core/repositories/postgres';
import { IsChannelValueValidConstraint, IsChannelValue } from './person-channel.validator';

const mockPersonService = {
  isChannelExist: jest.fn().mockResolvedValue(false),
};

class TestDto {
  type!: ChannelType;

  @IsChannelValue()
  value!: any;

  constructor(type: ChannelType, value: any) {
    this.type = type;
    this.value = value;
  }
}

describe('IsChannelValue (Custom Validator)', () => {
  let constraint: IsChannelValueValidConstraint;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IsChannelValueValidConstraint,
        {
          provide: PersonService,
          useValue: mockPersonService,
        },
      ],
    }).compile();

    useContainer(module, { fallbackOnErrors: true });

    constraint = module.get<IsChannelValueValidConstraint>(IsChannelValueValidConstraint);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPersonService.isChannelExist.mockResolvedValue(false);
  });

  describe('Unit Tests: IsChannelValueValidConstraint', () => {
    const mockArgs = (type: any, value: any = ''): ValidationArguments => ({
      value,
      object: { type, value },
      property: 'value',
      targetName: 'TestDto',
      constraints: [],
    });

    it('should return true if object or type is missing', async () => {
      expect(await constraint.validate('test', {} as any)).toBe(true);
      expect(await constraint.validate('test', { object: {} } as any)).toBe(true);
    });

    it('should validate email correctly when it does not exist', async () => {
      const args = mockArgs(ChannelType.EMAIL, 'test@example.com');
      expect(await constraint.validate('test@example.com', args)).toBe(true);
      expect(mockPersonService.isChannelExist).toHaveBeenCalledWith(ChannelType.EMAIL, 'test@example.com', undefined);
    });

    it('should fail syntax email validation without database call', async () => {
      const args = mockArgs(ChannelType.EMAIL, 'invalid-email');
      expect(await constraint.validate('invalid-email', args)).toBe(false);
      expect(mockPersonService.isChannelExist).not.toHaveBeenCalled();
    });

    it('should fail email validation if it already exists in database', async () => {
      mockPersonService.isChannelExist.mockResolvedValue(true);
      const args = mockArgs(ChannelType.EMAIL, 'exists@example.com');

      expect(await constraint.validate('exists@example.com', args)).toBe(false);
    });

    it('should validate phone correctly when it does not exist', async () => {
      const args = mockArgs(ChannelType.PHONE, '+79991112233');
      expect(await constraint.validate('+79991112233', args)).toBe(true);
    });

    it('should validate telegram correctly when it does not exist', async () => {
      const args = mockArgs(ChannelType.TELEGRAM, '@my_nickname1');
      expect(await constraint.validate('@my_nickname1', args)).toBe(true);
    });

    it('should return default messages based on type', () => {
      expect(constraint.defaultMessage(mockArgs(ChannelType.EMAIL))).toContain('Email');
      expect(constraint.defaultMessage(mockArgs(ChannelType.PHONE))).toContain('телефона');
      expect(constraint.defaultMessage(mockArgs(ChannelType.TELEGRAM))).toContain('Telegram');
      expect(constraint.defaultMessage(mockArgs(null))).toContain('Некорректное значение');
    });
  });

  describe('Integration Tests: Decorator with class-validator', () => {
    it('should pass validation for a valid and unique email', async () => {
      const dto = new TestDto(ChannelType.EMAIL, 'ivan@mail.ru');
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation and return specific message for existing email', async () => {
      mockPersonService.isChannelExist.mockResolvedValue(true);

      const dto = new TestDto(ChannelType.EMAIL, 'ivan@mail.ru');
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('value');
      expect(Object.values(errors[0].constraints!)).toContain(
        'Некорректный формат Email или данный Email адрес уже зарегистрирован',
      );
    });

    it('should fail validation for telegram username without @', async () => {
      const dto = new TestDto(ChannelType.TELEGRAM, 'username_123');
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(Object.values(errors[0].constraints!)).toContain(
        'Некорректный юзернейм Telegram или данный аккаунт уже привязан',
      );
    });
  });
});
