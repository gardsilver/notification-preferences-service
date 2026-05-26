import { DateTimestampHelper } from './date-timestamp.helper';
import {
  DATE_BASE_FORMAT,
  DATE_FORMAT,
  DATE_TIME_FORMAT,
  DATE_TIME_WORLD_STANDARD_FORMAT,
  DATE_WORLD_STANDARD_FORMAT,
  DATE_YEAR_FORMAT,
  TIME_FORMAT,
  TIME_HOUR_FORMAT,
  TIME_MILLISECOND_FORMAT,
  TIME_MINUTE_FORMAT,
} from '../types/constants';

describe(DateTimestampHelper.name, () => {
  it(DateTimestampHelper.parseOffset.name, async () => {
    expect(DateTimestampHelper.parseOffset('2023-03-03 05:00:00+07:00')).toBe(420);
    expect(DateTimestampHelper.parseOffset('2023-03-03 05:00:00+03:00')).toBe(180);
    expect(DateTimestampHelper.parseOffset('2023-03-03 05:00:00')).toBe(0);
    expect(DateTimestampHelper.parseOffset('2023-03-03 05:00:00Z')).toBe(0);
    expect(DateTimestampHelper.parseOffset('2023-03-03')).toBe(0);
    expect(DateTimestampHelper.parseOffset('03.03.2023', DATE_FORMAT)).toBe(0);
    expect(DateTimestampHelper.parseOffset('03.03.2023 05:00:00', DATE_TIME_FORMAT)).toBe(0);
    expect(DateTimestampHelper.parseOffset('03.03.2023 05:00:00+03:00', `${DATE_TIME_FORMAT}Z`)).toBe(180);
  });

  it(DateTimestampHelper.parseFormat.name, async () => {
    expect(DateTimestampHelper.parseFormat('3')).toBeNull();
    expect(DateTimestampHelper.parseFormat('0300')).toBeNull();
    expect(DateTimestampHelper.parseFormat('10:10')).toBe(`${TIME_HOUR_FORMAT}:${TIME_MINUTE_FORMAT}`);

    expect(DateTimestampHelper.parseFormat('03.03.2023')).toBe(DATE_FORMAT);
    expect(DateTimestampHelper.parseFormat('03.03.2023 05:00')).toBe(
      DATE_FORMAT + ` ${TIME_HOUR_FORMAT}:${TIME_MINUTE_FORMAT}`,
    );
    expect(DateTimestampHelper.parseFormat('03.03.2023 05:00:00')).toBe(DATE_TIME_FORMAT);
    expect(DateTimestampHelper.parseFormat('03.03.2023 05:00:00.125')).toBe(
      DATE_TIME_FORMAT + `.${TIME_MILLISECOND_FORMAT}`,
    );
    expect(DateTimestampHelper.parseFormat('03.03.2023T05:00:00')).toBe(`${DATE_FORMAT}[T]${TIME_FORMAT}`);
    expect(DateTimestampHelper.parseFormat('03.03.2023T05:00:00+03:00')).toBe(`${DATE_FORMAT}[T]${TIME_FORMAT}Z`);
    expect(DateTimestampHelper.parseFormat('03.03.2023 05:00:00Z')).toBe(`${DATE_TIME_FORMAT}Z`);
    expect(DateTimestampHelper.parseFormat('03.03.2023T05:00:00Z')).toBe(`${DATE_FORMAT}[T]${TIME_FORMAT}Z`);

    expect(DateTimestampHelper.parseFormat('2023-03-03')).toBe(DATE_WORLD_STANDARD_FORMAT);
    expect(DateTimestampHelper.parseFormat('2023-03-03 05:00:00')).toBe(DATE_TIME_WORLD_STANDARD_FORMAT);
    expect(DateTimestampHelper.parseFormat('2023-03-03T05:00:00')).toBe(
      `${DATE_WORLD_STANDARD_FORMAT}[T]${TIME_FORMAT}`,
    );
    expect(DateTimestampHelper.parseFormat('2023-03-03T05:00:00+03:00')).toBe(DATE_BASE_FORMAT);
    expect(DateTimestampHelper.parseFormat('2023-03-03 05:00:00Z')).toBe(`${DATE_TIME_WORLD_STANDARD_FORMAT}Z`);
    expect(DateTimestampHelper.parseFormat('2023-03-03T05:00:00Z')).toBe(DATE_BASE_FORMAT);

    expect(DateTimestampHelper.parseFormat('2023')).toBe(DATE_YEAR_FORMAT);
    expect(DateTimestampHelper.parseFormat('05:00:00')).toBe(TIME_FORMAT);
    expect(DateTimestampHelper.parseFormat('05:00:00.125')).toBe(TIME_FORMAT + `.${TIME_MILLISECOND_FORMAT}`);
    expect(DateTimestampHelper.parseFormat('05:00:00+03:00')).toBe(`${TIME_FORMAT}Z`);
    expect(DateTimestampHelper.parseFormat('+03:00')).toBe('Z');
    expect(DateTimestampHelper.parseFormat('-03:00')).toBe('Z');
  });

  it(DateTimestampHelper.initClientTimezoneOffset.name, async () => {
    expect(DateTimestampHelper.initClientTimezoneOffset()).toBe(180);
    expect(DateTimestampHelper.initClientTimezoneOffset(undefined)).toBe(180);
    expect(DateTimestampHelper.initClientTimezoneOffset(null)).toBe(180);
    expect(DateTimestampHelper.initClientTimezoneOffset('2023-03-03 05:00:00+07:00')).toBe(420);
    expect(DateTimestampHelper.initClientTimezoneOffset('2023-03-03 05:00:00+03:00')).toBe(180);
    expect(DateTimestampHelper.initClientTimezoneOffset('2023-03-03 05:00:00')).toBe(180);
    expect(DateTimestampHelper.initClientTimezoneOffset('2023-03-03 05:00:00Z')).toBe(0);
    expect(DateTimestampHelper.initClientTimezoneOffset('2023-03-03')).toBe(180);
    expect(DateTimestampHelper.initClientTimezoneOffset('03.03.2023')).toBe(180);
    expect(DateTimestampHelper.initClientTimezoneOffset('03.03.2023 05:00:00')).toBe(180);
    expect(DateTimestampHelper.initClientTimezoneOffset('03.03.2023 05:00:00Z')).toBe(0);
    expect(DateTimestampHelper.initClientTimezoneOffset('03.03.2023 05:00:00+07:00')).toBe(420);
  });
});
