import { IQuietRanges } from '../types/types';

export abstract class QuietRangesHelper {
  /**
   * Конвертирует минуты начала и конца тишины в строковое представление int4multirange для PostgreSQL.
   */
  public static convertMinutesToQuietRanges(start: number, finish: number): string {
    // Если время совпадает, то по вашему условию тишина выключена (записываем {[0,0]})
    if (start === finish) {
      return '{[0,0]}';
    }

    if (start > finish) {
      return `{[${start},1440],[0,${finish}]}`;
    }

    return `{[${start},${finish}]}`;
  }

  /**
   * Конвертирует quietRanges из базы данных (учитывая канонический формат Postgres) обратно в минуты.
   */
  public static convertQuietRangesToMinutes(quietRanges: unknown): IQuietRanges {
    const defaultResult = { quietStart: 0, quietFinish: 0 };

    if (typeof quietRanges !== 'string' || quietRanges === '{}' || !quietRanges.trim()) {
      return defaultResult;
    }

    // Регулярное выражение теперь ищет числа и проверяет, какая скобка стоит в конце: ] или )
    // Группа 1: старт, Группа 2: финиш, Группа 3: закрывающая скобка
    const matches = [...quietRanges.matchAll(/\[(\d+),(\d+)(\)|\])/g)];

    if (matches.length === 0) {
      return defaultResult;
    }

    // Вспомогательная функция для правильного вычисления верхней границы
    const parseUpperBoundary = (rawVal: string, bracket: string): number => {
      const val = parseInt(rawVal, 10);
      // Если скобка круглая ')', Postgres прибавил 1 к значению. Вычитаем её назад.
      return bracket === ')' ? val - 1 : val;
    };

    // Случай 1: Один интервал внутри дня или {[0,0]}
    if (matches.length === 1) {
      const start = parseInt(matches[0][1], 10);
      const finish = parseUpperBoundary(matches[0][2], matches[0][3]);

      if (start === finish) {
        return defaultResult;
      }

      return { quietStart: start, quietFinish: finish };
    }

    // Случай 2: Два интервала (переход через полночь), например `{[0,481),[1320,1441)}`
    if (matches.length === 2) {
      const firstStart = parseInt(matches[0][1], 10);
      const firstEnd = parseUpperBoundary(matches[0][2], matches[0][3]);

      const secondStart = parseInt(matches[1][1], 10);
      const secondEnd = parseUpperBoundary(matches[1][2], matches[1][3]);

      // База данных всегда вернет их в отсортированном порядке: сначала [0, finish), затем [start, 1440)
      // Проверяем каноничный порядок Postgres: первый интервал начинается с 0, второй заканчивается на 1440
      if (firstStart === 0 && secondEnd === 1440) {
        return { quietStart: secondStart, quietFinish: firstEnd };
      }

      // Запасной вариант на случай непредвиденной сортировки СУБД
      if (secondStart === 0 && firstEnd === 1440) {
        return { quietStart: firstStart, quietFinish: secondEnd };
      }
    }

    return defaultResult;
  }
}
