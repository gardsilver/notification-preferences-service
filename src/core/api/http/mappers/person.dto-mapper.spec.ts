/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { IPerson, IPersonChannel, IChannelSettings } from 'src/core/repositories/postgres';
import { DatetimeHelper } from 'src/core/app';
import { ResponseStatus } from '../dto/base.dto';
import { CreatePersonRequestDto } from '../dto/person.dto';
import { PersonDtoMapper } from './person.dto-mapper';

// Заменяем реальный хелпер времени на мок
jest.mock('src/core/app', () => ({
  DatetimeHelper: {
    minutesToTime: jest.fn(),
  },
}));

describe('PersonDtoMapper', () => {
  let mapper: PersonDtoMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PersonDtoMapper],
    }).compile();

    mapper = module.get<PersonDtoMapper>(PersonDtoMapper);
    jest.clearAllMocks(); // Очищаем вызовы моков перед каждым тестом
  });

  it('should be defined', () => {
    expect(mapper).toBeDefined();
  });

  describe('toResponse', () => {
    it('should map person data to response successfully with valid channels and settings', () => {
      // Имитируем поведение DatetimeHelper.minutesToTime
      (DatetimeHelper.minutesToTime as jest.Mock).mockReturnValueOnce('22:00').mockReturnValueOnce('08:00');

      const mockDbData = {
        id: 'user-uuid',
        firstName: 'John',
        lastName: 'Doe',
        middleName: 'Michael',
        channels: [
          {
            id: 'channel-uuid',
            label: 'Work Email',
            settings: [
              {
                id: 'setting-uuid',
                quietRanges: { quietStart: 1320, quietFinish: 480 },
              } as unknown as IChannelSettings,
            ],
          } as IPersonChannel & { settings?: IChannelSettings[] },
        ],
      } as unknown as IPerson & { channels: (IPersonChannel & { settings?: IChannelSettings[] })[] };

      const result = mapper.toResponse(mockDbData);

      expect(result).toEqual({
        status: ResponseStatus.SUCCESS,
        data: {
          id: 'user-uuid',
          firstName: 'John',
          lastName: 'Doe',
          middleName: 'Michael',
          channels: [
            {
              id: 'channel-uuid',
              label: 'Work Email',
              settings: [
                {
                  id: 'setting-uuid',
                  quietRanges: { quietStart: '22:00', quietFinish: '08:00' },
                },
              ],
            },
          ],
        },
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(DatetimeHelper.minutesToTime).toHaveBeenCalledWith(1320);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(DatetimeHelper.minutesToTime).toHaveBeenCalledWith(480);
    });

    it('should fallback quietRanges to "00" if minutesToTime returns an empty value', () => {
      (DatetimeHelper.minutesToTime as jest.Mock).mockReturnValue(undefined);

      const mockDbData = {
        id: 'uuid',
        firstName: 'Ivan',
        lastName: 'Ivanov',
        middleName: null,
        channels: [
          {
            id: 'ch-id',
            label: null,
            settings: [{ id: 'set-id', quietRanges: { quietStart: 0, quietFinish: 0 } } as unknown as IChannelSettings],
          } as any,
        ],
      } as unknown as IPerson & { channels: (IPersonChannel & { settings?: IChannelSettings[] })[] };

      const result = mapper.toResponse(mockDbData);

      expect(result?.data?.id).toBe('uuid');
      expect(result?.data?.middleName).toBeUndefined(); // null превращается в undefined
      expect(result?.data?.channels?.[0].label).toBeUndefined(); // null превращается в undefined
      expect(result?.data?.channels?.[0].settings?.[0].quietRanges).toEqual({
        quietStart: '00',
        quietFinish: '00',
      });
    });

    it('should return empty settings array if channel settings are missing', () => {
      const mockDbData: any = {
        id: 'uuid',
        channels: [{ id: 'ch-id', settings: undefined }],
      };

      const result = mapper.toResponse(mockDbData);
      expect(result?.data?.channels?.[0].settings).toEqual([]);
    });
  });

  describe('toPerson', () => {
    it('should strip channels and id fields from DTO', () => {
      const mockDto: CreatePersonRequestDto = {
        id: 'some-id',
        firstName: 'Alex',
        lastName: 'Smith',
        channels: [{ label: 'Telegram' }] as any,
      } as any;

      const result = mapper.toPerson(mockDto);

      expect(result).toEqual({
        firstName: 'Alex',
        lastName: 'Smith',
        channels: undefined,
        id: undefined,
      });
    });
  });

  describe('toChannels', () => {
    it('should return empty array if dto has no channels', () => {
      const mockDtoEmpty: CreatePersonRequestDto = { firstName: 'Alex' } as any;
      const mockDtoNull: CreatePersonRequestDto = { channels: null } as any;

      expect(mapper.toChannels(mockDtoEmpty)).toEqual([]);
      expect(mapper.toChannels(mockDtoNull)).toEqual([]);
    });

    it('should correctly map channels with settings and explicit quietRanges', () => {
      const mockDto: CreatePersonRequestDto = {
        channels: [
          {
            label: 'SMS',
            settings: [
              {
                quietRanges: { quietStart: 100, quietFinish: 200 },
              },
            ],
          },
        ],
      } as any;

      const result = mapper.toChannels(mockDto);

      expect(result).toEqual([
        {
          label: 'SMS',
          settings: [
            {
              quietRanges: { quietStart: 100, quietFinish: 200 },
            },
          ],
        },
      ]);
    });

    it('should set default quietRanges if they are not provided in settings', () => {
      const mockDto: CreatePersonRequestDto = {
        channels: [
          {
            label: 'Push',
            settings: [
              {
                quietRanges: undefined, // Отсутствуют диапазоны тишины
              },
            ],
          },
        ],
      } as any;

      const result = mapper.toChannels(mockDto);

      expect(result[0].settings[0].quietRanges).toEqual({
        quietStart: 0,
        quietFinish: 0,
      });
    });
  });
});
