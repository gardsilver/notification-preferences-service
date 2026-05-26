Да, текущий CHECK:

```sql
lower(r) >= upper(r)
```

ломает overnight quiet periods.

Например:

```text
23:00 → 06:00
```

невозможно сохранить как:

```sql
[1380,360)
```

потому что PostgreSQL range обязан иметь:

```text
lower < upper
```

---

# Правильная архитектура quiet_ranges

Нужно хранить overnight interval как ДВА диапазона.

---

# Как хранить quiet_ranges

---

## Пример 1 — обычный диапазон

Тихий час:

```text
10:00 → 12:00
```

Хранится:

```sql
'{[600,720)}'::int4multirange
```

---

## Пример 2 — overnight диапазон

Тихий час:

```text
23:00 → 06:00
```

Хранится как:

```sql
'{[1380,1440),[0,360)}'::int4multirange
```

---

# Исправленный CHECK constraint

Ваш текущий CHECK почти правильный.

Нужно только:

* разрешить multirange,
* запретить invalid values,
* оставить поддержку overnight через split ranges.

---

# Новый CHECK

```sql
ALTER TABLE person_notification_settings
DROP CONSTRAINT indxpns_check_quiet_ranges;
```

---

```sql
ALTER TABLE person_notification_settings
ADD CONSTRAINT indxpns_check_quiet_ranges
CHECK (
  NOT EXISTS (
    SELECT 1
    FROM unnest(quiet_ranges) r
    WHERE
      lower(r) < 0
      OR upper(r) > 1440
      OR isempty(r)
      OR lower(r) >= upper(r)
  )
);
```

---

# Почему lower(r) >= upper(r) остается

Потому что:

```text
overnight interval
```

теперь хранится как:

```text
2 отдельных valid ranges
```

а не одним invalid range.

---

# Как API должен преобразовывать quiet hours

---

# Вход API

```json
{
  "from": "23:00",
  "to": "06:00"
}
```

---

# Конвертация

---

## helper

```ts
function toMinute(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}
```

---

## build multirange

```ts
function buildQuietRanges(from: string, to: string): string {
  const fromMinute = toMinute(from);
  const toMinuteValue = toMinute(to);

  // обычный диапазон
  if (fromMinute < toMinuteValue) {
    return `{[${fromMinute},${toMinuteValue})}`;
  }

  // overnight диапазон
  return `{[${fromMinute},1440),[0,${toMinuteValue})}`;
}
```

---

# Примеры

---

## 22:00 → 23:00

```sql
'{[1320,1380)}'
```

---

## 23:00 → 06:00

```sql
'{[1380,1440),[0,360)}'
```

---

## 00:00 → 08:00

```sql
'{[0,480)}'
```

---

# Как теперь выглядит проверка

Она НЕ меняется.

И это главный плюс архитектуры.

---

# Проверка попадания minute в quiet_ranges

```sql
quiet_ranges @> int4range(person_minute, person_minute + 1)
```

---

# Полный запрос проверки can_send

```sql
SELECT
  pns.id,

  (
    EXTRACT(HOUR FROM local_dt)::int * 60
    +
    EXTRACT(MINUTE FROM local_dt)::int
  ) AS person_minute,

  NOT (
    pns.quiet_ranges @>
    int4range(
      (
        EXTRACT(HOUR FROM local_dt)::int * 60
        +
        EXTRACT(MINUTE FROM local_dt)::int
      ),
      (
        EXTRACT(HOUR FROM local_dt)::int * 60
        +
        EXTRACT(MINUTE FROM local_dt)::int
      ) + 1
    )
  ) AS can_send

FROM person_notification_settings pns

JOIN person_channel pc
  ON pc.id = pns.person_channel_id

JOIN person p
  ON p.id = pns.person_id

CROSS JOIN LATERAL (
  SELECT (
    (:person_datetime AT TIME ZONE 'UTC')
    AT TIME ZONE p.timezone
  ) AS local_dt
) tz

WHERE
  pns.person_id = :person_id
  AND pns.type = :notification_type
  AND pns.status = 1

  AND pc.type = :channel_type
  AND pc.status = 1
  AND pc.is_verified = true

  AND p.region_code = :region

LIMIT 1;
```

---

# Можно сделать быстрее

Чтобы не вычислять minute 3 раза:

---

## Оптимизированный вариант

```sql
SELECT
  pns.id,
  t.person_minute,

  NOT (
    pns.quiet_ranges @>
    int4range(
      t.person_minute,
      t.person_minute + 1
    )
  ) AS can_send

FROM person_notification_settings pns

JOIN person_channel pc
  ON pc.id = pns.person_channel_id

JOIN person p
  ON p.id = pns.person_id

CROSS JOIN LATERAL (
  SELECT
    (
      EXTRACT(HOUR FROM (
        (:person_datetime AT TIME ZONE 'UTC')
        AT TIME ZONE p.timezone
      ))::int * 60
      +
      EXTRACT(MINUTE FROM (
        (:person_datetime AT TIME ZONE 'UTC')
        AT TIME ZONE p.timezone
      ))::int
    ) AS person_minute
) t

WHERE
  pns.person_id = :person_id
  AND pns.type = :notification_type
  AND pns.status = 1

  AND pc.type = :channel_type
  AND pc.status = 1
  AND pc.is_verified = true

  AND p.region_code = :region

LIMIT 1;
```

---

# Еще лучше — generated column

Можно вообще избавиться от runtime timezone conversion.

---

# Идея production-grade решения

Хранить:

```sql
person.utc_offset_minutes
```

например:

```text
Europe/Moscow = 180
```

тогда:

```sql
person_minute =
(
  (
    extract(epoch from :person_datetime)::int / 60
    + utc_offset_minutes
  ) % 1440
)
```

Это:

* намного быстрее,
* без AT TIME ZONE,
* immutable expression,
* отлично индексируется.

Но:

* надо обновлять DST offsets,
* нужна cron/job.
