import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { DatetimeHelper } from 'src/core/app';
import {
  BaseResponseDto,
  BaseIdRequestDto,
  BaseRegionCodeRequestDto,
  BaseNotificationFieldsRequestDto,
  BaseNotificationStatusRequestDto,
  QuietRangesRequestData,
  QuietRangesRequestDto,
  BaseIdResponseDto,
  BaseRegionCodeResponseDto,
  QuietRangesResponseDto,
  ResponseStatus,
} from './base.dto'; // Укажите правильный путь к файлу
import { ChannelType, NotificationStatus, NotificationType } from 'src/core/repositories/postgres';

// Мокаем хелпер времени для тестов интервалов тишины
jest.mock('src/core/app', () => ({
  DatetimeHelper: {
    timeToMinutes: jest.fn((time: string) => {
      if (time === '22:00') return 1320;
      if (time === '08:00') return 480;
      // Если передана невалидная строка времени, возвращаем NaN, чтобы сломать @IsInt
      return NaN;
    }),
  },
}));

describe('Base DTOs', () => {
  describe('Response Schema Layouts', () => {
    it('should correctly instantiate response schemas', () => {
      const baseResponse = new BaseResponseDto();
      baseResponse.status = ResponseStatus.SUCCESS;
      baseResponse.details = 'OK';
      baseResponse.data = { foo: 'bar' };

      const idResponse = new BaseIdResponseDto();
      idResponse.id = 'uuid';

      const regionResponse = new BaseRegionCodeResponseDto();
      regionResponse.regionCode = 'RU';

      const qrResponse = new QuietRangesResponseDto();
      qrResponse.quietRanges = { quietStart: '22:00', quietFinish: '08:00' };

      expect(baseResponse.status).toBe(ResponseStatus.SUCCESS);
      expect(idResponse.id).toBe('uuid');
      expect(regionResponse.regionCode).toBe('RU');
      expect(qrResponse.quietRanges.quietStart).toBe('22:00');
    });
  });

  describe('BaseIdRequestDto', () => {
    it('should successfully validate correct UUID and trim spaces', async () => {
      const plain = { id: '  4fa0e21a-e7be-4b95-8df4-069c3a3cfef9  ' };
      const dto = plainToInstance(BaseIdRequestDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.id).toBe('4fa0e21a-e7be-4b95-8df4-069c3a3cfef9');
    });

    it('should fail if id is empty or not a valid UUID', async () => {
      const plain = { id: 'invalid-id' };
      const dto = plainToInstance(BaseIdRequestDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('id');
    });
  });

  describe('BaseRegionCodeRequestDto', () => {
    it('should uppercase and trim valid regionCode', async () => {
      const plain = { regionCode: '  ru  ' };
      const dto = plainToInstance(BaseRegionCodeRequestDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.regionCode).toBe('RU');
    });

    it('should fail validation if regionCode is not 2 characters long', async () => {
      const plain = { regionCode: 'RUS' };
      const dto = plainToInstance(BaseRegionCodeRequestDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('regionCode');
    });
  });

  describe('BaseNotificationFieldsRequestDto', () => {
    it('should lowercase notificationType and channelType and pass validation', async () => {
      const plain = {
        notificationType: '  MARKETING  ',
        channelType: '  EmAiL  ',
        regionCode: 'RU',
      };
      const dto = plainToInstance(BaseNotificationFieldsRequestDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.notificationType).toBe(NotificationType.MARKETING);
      expect(dto.channelType).toBe(ChannelType.EMAIL);
    });

    it('should fail if notificationType or channelType are invalid', async () => {
      const plain = {
        notificationType: 'invalid_type',
        channelType: 'fax',
      };
      const dto = plainToInstance(BaseNotificationFieldsRequestDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const props = errors.map((e) => e.property);
      expect(props).toContain('notificationType');
      expect(props).toContain('channelType');
    });
  });

  describe('BaseNotificationStatusRequestDto', () => {
    it('should parse valid string status to genuine number', async () => {
      const plain = { status: '  1  ' };
      const dto = plainToInstance(BaseNotificationStatusRequestDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.status).toBe(NotificationStatus.ACTIVE);
    });

    it('should keep undefined or return non-numeric value as is to fail validation', async () => {
      const plain = { status: '  invalid_status  ' };
      const dto = plainToInstance(BaseNotificationStatusRequestDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(Number.isNaN(dto.status)).toBe(true);
    });

    it('should successfully pass validation if status is empty string or missing (IsOptional)', async () => {
      const plain = { status: '   ' };
      const dto = plainToInstance(BaseNotificationStatusRequestDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.status).toBeUndefined();
    });
  });

  describe('QuietRangesRequestData & QuietRangesRequestDto', () => {
    it('should convert time string to minutes and validate successfully', async () => {
      const plainData = { quietStart: '22:00', quietFinish: '08:00' };
      const dtoData = plainToInstance(QuietRangesRequestData, plainData);
      const errorsData = await validate(dtoData);

      expect(errorsData.length).toBe(0);
      expect(dtoData.quietStart).toBe(1320);
      expect(dtoData.quietFinish).toBe(480);
      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      expect(DatetimeHelper.timeToMinutes).toHaveBeenCalledWith('22:00');
      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      expect(DatetimeHelper.timeToMinutes).toHaveBeenCalledWith('08:00');
    });

    it('should fail if values are outside 0-1440 range', async () => {
      const plainData = { quietStart: -5, quietFinish: 2000 };
      const dtoData = plainToInstance(QuietRangesRequestData, plainData);
      const errorsData = await validate(dtoData);

      expect(errorsData.length).toBeGreaterThan(0);
      const props = errorsData.map((e) => e.property);
      expect(props).toContain('quietStart');
      expect(props).toContain('quietFinish');
    });

    it('should recursively validate QuietRangesRequestDto nested structure', async () => {
      const plainDto = {
        quietRanges: {
          quietStart: '22:00',
          quietFinish: '08:00',
        },
      };
      const dto = plainToInstance(QuietRangesRequestDto, plainDto);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.quietRanges).toBeInstanceOf(QuietRangesRequestData);
    });

    it('should catch errors in nested validation of QuietRangesRequestDto', async () => {
      const plainDto = {
        quietRanges: {
          quietStart: 'not-a-time',
          quietFinish: '08:00',
        },
      };
      const dto = plainToInstance(QuietRangesRequestDto, plainDto);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('quietRanges');
      expect(errors[0].children?.length).toBeGreaterThan(0);
    });
  });
});
