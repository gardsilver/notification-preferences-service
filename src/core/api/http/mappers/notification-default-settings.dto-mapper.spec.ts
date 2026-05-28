/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { DatetimeHelper } from 'src/core/app';
import { ResponseStatus } from '../dto/base.dto';
import { NotificationDefaultSettingsDtoMapper } from './notification-default-settings.dto-mapper';

// Заменяем реальный хелпер времени на мок
jest.mock('src/core/app', () => ({
  DatetimeHelper: {
    minutesToTime: jest.fn(),
  },
}));

describe('NotificationDefaultSettingsDtoMapper', () => {
  let mapper: NotificationDefaultSettingsDtoMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationDefaultSettingsDtoMapper],
    }).compile();

    mapper = module.get<NotificationDefaultSettingsDtoMapper>(NotificationDefaultSettingsDtoMapper);
    jest.clearAllMocks();
  });

  describe('toRepositoryInput', () => {
    it('should map type and include quietRanges if both quietStart and quietFinish are defined', () => {
      const mockDto: any = {
        type: 'PUSH',
        quietStart: 60,
        quietFinish: 180,
      };

      const result = mapper.toRepositoryInput(mockDto);

      expect(result).toEqual({
        type: 'PUSH',
        quietRanges: {
          quietStart: 60,
          quietFinish: 180,
        },
      });
    });

    it('should not include quietRanges if quietStart or quietFinish are missing', () => {
      const mockDto: any = {
        type: 'EMAIL',
        quietStart: 60,
        // quietFinish отсутствует
      };

      const result = mapper.toRepositoryInput(mockDto);

      expect(result).toEqual({
        type: 'EMAIL',
      });
    });
  });

  describe('toResponse', () => {
    it('should successfully map repository result to response and convert minutes to time string', () => {
       
      (DatetimeHelper.minutesToTime as jest.Mock).mockReturnValueOnce('01:00').mockReturnValueOnce('03:00');

      const mockSettings: any = {
        id: 'settings-uuid',
        type: 'SMS',
        quietRanges: {
          quietStart: 60,
          quietFinish: 180,
        },
      };

      const result = mapper.toResponse(mockSettings);

      expect(result).toEqual({
        status: ResponseStatus.SUCCESS,
        data: {
          id: 'settings-uuid',
          type: 'SMS',
          quietStart: '01:00',
          quietFinish: '03:00',
          quietRanges: undefined,
        },
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(DatetimeHelper.minutesToTime).toHaveBeenCalledWith(60);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(DatetimeHelper.minutesToTime).toHaveBeenCalledWith(180);
    });

    it('should fallback to "00" if id is missing and DatetimeHelper returns falsy value', () => {
      (DatetimeHelper.minutesToTime as jest.Mock).mockReturnValue(undefined);

      const mockSettings: any = {
        id: null,
        type: 'PUSH',
        quietRanges: {
          quietStart: 0,
          quietFinish: 0,
        },
      };

      const result = mapper.toResponse(mockSettings);

      expect(result?.data?.id).toBe('');
      expect(result?.data?.quietStart).toBe('00');
      expect(result?.data?.quietFinish).toBe('00');
    });
  });
});
