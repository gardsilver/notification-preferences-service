import { DateTimestamp } from 'src/modules/date-timestamp';
import { DatetimeHelper } from './datetime.helper';

describe('DatetimeHelper', () => {
  describe('timeToMinutes (Строка HH:mm -> Минуты)', () => {
    it('должен успешно переводить корректное время в минуты', () => {
      expect(DatetimeHelper.timeToMinutes('00:00')).toBe(0);
      expect(DatetimeHelper.timeToMinutes('01:30')).toBe(90);
      expect(DatetimeHelper.timeToMinutes('12:00')).toBe(720);
      expect(DatetimeHelper.timeToMinutes('23:59')).toBe(1439);
    });

    it('должен корректно обрабатывать пробелы по краям строки', () => {
      expect(DatetimeHelper.timeToMinutes('  08:15  ')).toBe(495);
    });

    it('должен возвращать null для пустых строк', () => {
      expect(DatetimeHelper.timeToMinutes('')).toBeNull();
      expect(DatetimeHelper.timeToMinutes('   ')).toBeNull();
    });

    it('должен возвращать NaN для невалидного формата времени', () => {
      expect(DatetimeHelper.timeToMinutes('24:00')).toBeNaN();
      expect(DatetimeHelper.timeToMinutes('12:60')).toBeNaN();
      expect(DatetimeHelper.timeToMinutes('5:15')).toBeNaN(); // без ведущего нуля
      expect(DatetimeHelper.timeToMinutes('abc')).toBeNaN();
    });
  });

  describe('minutesToTime (Минуты -> Строка HH:mm)', () => {
    it('должен успешно переводить минуты в строковый формат времени', () => {
      expect(DatetimeHelper.minutesToTime(0)).toBe('00:00');
      expect(DatetimeHelper.minutesToTime(90)).toBe('01:30');
      expect(DatetimeHelper.minutesToTime(720)).toBe('12:00');
      expect(DatetimeHelper.minutesToTime(1439)).toBe('23:59');
    });

    it('должен возвращать null, если значение выходит за границы суток (0-1439)', () => {
      expect(DatetimeHelper.minutesToTime(-1)).toBeNull();
      expect(DatetimeHelper.minutesToTime(1440)).toBeNull();
      expect(DatetimeHelper.minutesToTime(2000)).toBeNull();
    });

    it('должен возвращать null для некорректных или пустых входных данных', () => {
      expect(DatetimeHelper.minutesToTime(null)).toBeNull();
      expect(DatetimeHelper.minutesToTime(undefined)).toBeNull();
      expect(DatetimeHelper.minutesToTime(NaN)).toBeNull();
      expect(DatetimeHelper.minutesToTime(Infinity)).toBeNull();
      expect(DatetimeHelper.minutesToTime(-Infinity)).toBeNull();
    });
  });
});

describe('datetimeToLocalMinuteOfDay', () => {
  it('should return correct minute of day for UTC timezone', () => {
    const datetime = new DateTimestamp('2024-01-01 12:30:00');

    const result = DatetimeHelper.datetimeToLocalMinuteOfDay(datetime, 'UTC');

    // Moscow +03:00 -> UTC 09:30
    expect(result).toBe(9 * 60 + 30);
  });

  it('should return correct minute of day for another timezone', () => {
    const datetime = new DateTimestamp('2024-01-01 12:30:00');

    const result = DatetimeHelper.datetimeToLocalMinuteOfDay(datetime, 'Europe/Berlin');

    // Moscow +03:00 -> Berlin +01:00 = 10:30
    expect(result).toBe(10 * 60 + 30);
  });

  it('should correctly handle day rollover', () => {
    const datetime = new DateTimestamp('2024-01-01 01:15:00');

    const result = DatetimeHelper.datetimeToLocalMinuteOfDay(datetime, 'UTC');

    // Moscow +03:00 -> UTC previous day 22:15
    expect(result).toBe(22 * 60 + 15);
  });

  it('should not mutate original datetime', () => {
    const datetime = new DateTimestamp('2024-01-01 12:30:00');

    DatetimeHelper.datetimeToLocalMinuteOfDay(datetime, 'UTC');

    expect(datetime.format('YYYY-MM-DD HH:mm:ss Z')).toBe('2024-01-01 12:30:00 +03:00');
  });

  it('should support daylight saving timezone', () => {
    const datetime = new DateTimestamp('2024-07-01 12:00:00');

    const result = DatetimeHelper.datetimeToLocalMinuteOfDay(datetime, 'Europe/Berlin');

    // Moscow +03:00 -> Berlin summer time +02:00 = 11:00
    expect(result).toBe(11 * 60);
  });
});
