import { QuietRangesHelper } from './quiet-ranges.helper';

describe('QuietRangesHelper', () => {
  describe('convertMinutesToQuietRanges (Минуты -> Строка Postgres)', () => {
    it('должен возвращать {[0,0]}, если время начала и конца совпадает (отключено)', () => {
      expect(QuietRangesHelper.convertMinutesToQuietRanges(0, 0)).toBe('{[0,0]}');
      expect(QuietRangesHelper.convertMinutesToQuietRanges(600, 600)).toBe('{[0,0]}');
    });

    it('должен возвращать один интервал, если тишина находится внутри одного дня', () => {
      // Тишина с 22:00 (1320) до 23:00 (1380)
      const result = QuietRangesHelper.convertMinutesToQuietRanges(1320, 1380);
      expect(result).toBe('{[1320,1380]}');
    });

    it('должен разделять на два интервала при переходе через полночь', () => {
      // Тишина с 22:00 (1320) до 08:00 (480) следующего дня
      const result = QuietRangesHelper.convertMinutesToQuietRanges(1320, 480);
      expect(result).toBe('{[1320,1440],[0,480]}');
    });
  });

  describe('convertQuietRangesToMinutes (Строка Postgres -> Минуты)', () => {
    const defaultResult = { quietStart: 0, quietFinish: 0 };

    describe('Пограничные и некорректные значения', () => {
      it('должен возвращать нули для пустых или некорректных типов данных', () => {
        expect(QuietRangesHelper.convertQuietRangesToMinutes(null)).toEqual(defaultResult);
        expect(QuietRangesHelper.convertQuietRangesToMinutes(undefined)).toEqual(defaultResult);
        expect(QuietRangesHelper.convertQuietRangesToMinutes('')).toEqual(defaultResult);
        expect(QuietRangesHelper.convertQuietRangesToMinutes('   ')).toEqual(defaultResult);
        expect(QuietRangesHelper.convertQuietRangesToMinutes('{}')).toEqual(defaultResult);
        expect(QuietRangesHelper.convertQuietRangesToMinutes('{invalid}')).toEqual(defaultResult);
        expect(QuietRangesHelper.convertQuietRangesToMinutes(12345)).toEqual(defaultResult);
      });

      it('должен возвращать нули, если передан интервал отключенной тишины {[0,0]}', () => {
        expect(QuietRangesHelper.convertQuietRangesToMinutes('{[0,0]}')).toEqual(defaultResult);
      });
    });

    describe('Случай 1: Один интервал (Внутри одного дня)', () => {
      it('должен корректно парсить включительную правую границу с квадратной скобкой "]"', () => {
        // Пример: {[1320,1380]}
        const result = QuietRangesHelper.convertQuietRangesToMinutes('{[1320,1380]}');
        expect(result).toEqual({ quietStart: 1320, quietFinish: 1380 });
      });

      it('должен корректно парсить исключительную правую границу с круглой скобкой ")"', () => {
        // Postgres часто превращает [1320,1380] в [1320,1381)
        const result = QuietRangesHelper.convertQuietRangesToMinutes('{[1320,1381)}');
        expect(result).toEqual({ quietStart: 1320, quietFinish: 1380 });
      });
    });

    describe('Случай 2: Два интервала (Переход через полночь)', () => {
      it('должен корректно собирать минуты из каноничного формата Postgres (круглые скобки)', () => {
        // База пришлет отсортировано по возрастанию: {[0,481),[1320,1441)}
        // Это соответствует диапазону с 22:00 (1320) до 08:00 (480)
        const rawFromDb = '{[0,481),[1320,1441)}';
        const result = QuietRangesHelper.convertQuietRangesToMinutes(rawFromDb);

        expect(result).toEqual({ quietStart: 1320, quietFinish: 480 });
      });

      it('должен корректно собирать минуты, если база прислала квадратные скобки', () => {
        // На случай, если в строке пришли включительные границы: {[0,480],[1320,1440]}
        const rawStr = '{[0,480],[1320,1440]}';
        const result = QuietRangesHelper.convertQuietRangesToMinutes(rawStr);

        expect(result).toEqual({ quietStart: 1320, quietFinish: 480 });
      });

      it('должен корректно отработать запасной сценарий при обратной сортировке интервалов', () => {
        // Сценарий, когда сначала идет интервал до 1440, а затем от 0: {[1320,1441),[0,481)}
        const reverseOrder = '{[1320,1441),[0,481)}';
        const result = QuietRangesHelper.convertQuietRangesToMinutes(reverseOrder);

        expect(result).toEqual({ quietStart: 1320, quietFinish: 480 });
      });

      it('должен вернуть дефолтные нули, если структура двух интервалов не соответствует логике полночи', () => {
        // Интервалы не завязаны на 0 и 1440 (например, просто два случайных диапазона внутри дня)
        const invalidIntervals = '{[10,20),[100,200)}';
        const result = QuietRangesHelper.convertQuietRangesToMinutes(invalidIntervals);

        expect(result).toEqual(defaultResult);
      });
    });
  });
});
