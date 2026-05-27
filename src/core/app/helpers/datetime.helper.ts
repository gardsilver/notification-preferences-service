import { DateTimestamp } from 'src/modules/date-timestamp';

// Регулярное выражение для строгой проверки формата HH:mm
const TIME_REGEXP = /^([01]\d|2[0-3]):([0-5]\d)$/;

export abstract class DatetimeHelper {
  public static timeToMinutes(timeRaw: string): number | null {
    const trimmed = timeRaw.trim();
    if (!trimmed) {
      return null;
    }

    if (!TIME_REGEXP.test(trimmed)) {
      return NaN;
    }

    const [hours, minutes] = trimmed.split(':').map(Number);

    return hours * 60 + minutes;
  }

  public static minutesToTime(minutesRaw: number | null | undefined): string | null {
    if (minutesRaw === null || minutesRaw === undefined || Number.isNaN(minutesRaw) || !Number.isFinite(minutesRaw)) {
      return null;
    }

    // В сутках 1440 минут (от 0:00 до 23:59 — это 0-1439)
    if (minutesRaw < 0 || minutesRaw >= 1440) {
      return null;
    }

    const hours = Math.floor(minutesRaw / 60);
    const minutes = minutesRaw % 60;

    // Дополняем нулями до двух знаков
    const paddedHours = hours.toString().padStart(2, '0');
    const paddedMinutes = minutes.toString().padStart(2, '0');

    return `${paddedHours}:${paddedMinutes}`;
  }

  public static datetimeToLocalMinuteOfDay(datetime: DateTimestamp, timezone: string): number {
    const localDatetime = datetime.clone().setTimezone(timezone);

    const localMoment = localDatetime.getMoment();

    return localMoment.hours() * 60 + localMoment.minutes();
  }
}
