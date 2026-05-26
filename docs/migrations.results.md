Ниже — рабочая схема для PostgreSQL + Sequelize/NestJS, с учетом:

* `quiet_ranges int4multirange` хранит интервалы минут суток `[0..1440)`
* `datetime` приходит в UTC
* проверка должна учитывать timezone пользователя
* нужен быстрый lookup:

  * person
  * тип уведомления
  * тип канала
  * регион
  * попадание в quiet hours

---

# 1. Вычисление `person_minute`

## Идея

Нужно:

1. взять UTC datetime
2. перевести в timezone пользователя
3. вычислить:

   * minute_of_day
   * день недели (если понадобится позже)

---

## SQL вычисления minute of day

```sql
(
  EXTRACT(HOUR FROM (:utc_datetime AT TIME ZONE p.timezone))::int * 60
  +
  EXTRACT(MINUTE FROM (:utc_datetime AT TIME ZONE p.timezone))::int
)
```

Например:

```sql
SELECT
  p.id,
  p.timezone,

  (:utc_datetime AT TIME ZONE p.timezone) AS person_datetime,

  (
    EXTRACT(HOUR FROM (:utc_datetime AT TIME ZONE p.timezone))::int * 60
    +
    EXTRACT(MINUTE FROM (:utc_datetime AT TIME ZONE p.timezone))::int
  ) AS person_minute

FROM person p
WHERE p.id = :person_id;
```

---

# 2. Проверка возможности отправки уведомления

---

# Важный момент про quiet_ranges

Сейчас у тебя:

```sql
int4multirange
```

где интервалы — минуты суток.

Например:

```sql
{
  [0,420),
  [1320,1440)
}
```

означает:

* 00:00 - 07:00
* 22:00 - 24:00

---

# Проверка попадания минуты в quiet range

PostgreSQL умеет:

```sql
quiet_ranges @> int4range(x, x + 1)
```

или проще:

```sql
quiet_ranges @> x
```

НО для multirange scalar containment работает только в новых версиях PostgreSQL.

Самый надежный вариант:

```sql
quiet_ranges @> int4range(:minute, :minute + 1)
```

---

# Полный запрос проверки

---

## Рекомендуемый вариант

```sql
SELECT
  pns.id,
  pns.status,
  pc.value,
  p.timezone,

  local_data.person_datetime,
  local_data.person_minute,

  (
    pns.quiet_ranges @> int4range(
      local_data.person_minute,
      local_data.person_minute + 1
    )
  ) AS is_quiet_time

FROM person_notification_settings pns

JOIN person p
  ON p.id = pns.person_id

JOIN person_channel pc
  ON pc.id = pns.person_channel_id

CROSS JOIN LATERAL (
  SELECT
    (:utc_datetime AT TIME ZONE p.timezone) AS person_datetime,

    (
      EXTRACT(HOUR FROM (:utc_datetime AT TIME ZONE p.timezone))::int * 60
      +
      EXTRACT(MINUTE FROM (:utc_datetime AT TIME ZONE p.timezone))::int
    ) AS person_minute
) local_data

WHERE
      pns.person_id = :person_id
  AND pns.type = :notification_type
  AND pns.status = 1

  AND pc.type = :channel_type
  AND pc.status = 1
  AND pc.is_verified = true

  AND p.region_code = :region

  -- НЕ попадает в quiet hours
  AND NOT (
    pns.quiet_ranges @> int4range(
      local_data.person_minute,
      local_data.person_minute + 1
    )
  )

LIMIT 1;
```

---

# 3. Индексы

---

# Основной bottleneck

Главный lookup идет по:

```sql
person_id
type
status
person_channel_id
```

и join к channel.

---

# Рекомендуемые индексы

---

## person

### Добавить composite index

Сейчас region_code отдельно не индексирован.

Добавь:

```sql
CREATE INDEX indxp_region_person
ON person(region_code, id);
```

---

## person_channel

Текущий:

```sql
(type, status, is_verified)
```

не идеален.

---

## Лучше

```sql
CREATE INDEX indxpc_lookup
ON person_channel(
  id,
  type,
  status,
  is_verified
);
```

ИЛИ даже:

```sql
CREATE INDEX indxpc_lookup2
ON person_channel(
  type,
  status,
  is_verified,
  id
);
```

если часто ищешь по типу канала.

---

# person_notification_settings

Текущий индекс хороший:

```sql
(person_id, type, status, person_channel_id)
```

Оставляем.

---

# GIST для quiet_ranges

Тоже правильно:

```sql
USING GIST (quiet_ranges)
```

Postgres сможет использовать:

```sql
quiet_ranges @> int4range(...)
```

---

# ВАЖНО: expression index НЕ нужен

Потому что:

```sql
person_minute
```

вычисляется динамически.

GIST multirange index уже достаточно.

---

# 4. Оптимизированный production query

---

## EXISTS вместо SELECT

Обычно нужно просто понять:

* можно слать?
* нельзя?

Тогда лучше:

```sql
SELECT EXISTS (
  SELECT 1
  FROM person_notification_settings pns

  JOIN person p
    ON p.id = pns.person_id

  JOIN person_channel pc
    ON pc.id = pns.person_channel_id

  CROSS JOIN LATERAL (
    SELECT (
      EXTRACT(HOUR FROM (:utc_datetime AT TIME ZONE p.timezone))::int * 60
      +
      EXTRACT(MINUTE FROM (:utc_datetime AT TIME ZONE p.timezone))::int
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

    AND NOT (
      pns.quiet_ranges @> int4range(
        t.person_minute,
        t.person_minute + 1
      )
    )
) AS can_send;
```

---

# 5. Sequelize entities

---

# PersonModel

```ts
import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
} from 'sequelize-typescript';

import { PersonChannelModel } from './person-channel.model';
import { PersonNotificationSettingsModel } from './person-notification-settings.model';

export interface IPerson {
  id?: string;

  createdAt: Date;
  updatedAt: Date;

  regionCode: string;
  timezone: string;

  birthday: string;

  lastName: string;
  firstName: string;
  middleName?: string | null;
}

@Table({
  tableName: 'person',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',

  indexes: [
    {
      fields: ['region_code', 'id'],
      name: 'indxp_region_person',
    },
  ],
})
export class PersonModel
  extends Model<IPerson>
  implements IPerson
{
  @Column({
    primaryKey: true,
    unique: true,
    allowNull: false,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id?: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare updatedAt: Date;

  @Column({
    type: DataType.STRING(2),
    allowNull: false,
    defaultValue: 'RU',
  })
  declare regionCode: string;

  @Column({
    type: DataType.STRING(60),
    allowNull: false,
    defaultValue: 'UTC',
  })
  declare timezone: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare birthday: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
  })
  declare lastName: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
  })
  declare firstName: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
  })
  declare middleName?: string | null;

  @HasMany(() => PersonChannelModel)
  declare channels: PersonChannelModel[];

  @HasMany(() => PersonNotificationSettingsModel)
  declare notificationSettings: PersonNotificationSettingsModel[];
}
```

---

# PersonChannelModel

```ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { PersonModel } from './person.model';

export interface IPersonChannel {
  id?: number;

  createdAt: Date;
  updatedAt: Date;

  personId: string;

  label?: string | null;

  status: number;
  isVerified: boolean;

  type: string;
  value: string;
}

@Table({
  tableName: 'person_channel',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',

  indexes: [
    {
      unique: true,
      fields: ['type', 'value'],
      name: 'indxpc_type_value',
    },
    {
      fields: ['type', 'status', 'is_verified', 'id'],
      name: 'indxpc_lookup2',
    },
  ],
})
export class PersonChannelModel
  extends Model<IPersonChannel>
  implements IPersonChannel
{
  @Column({
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    unique: true,
    type: DataType.BIGINT,
  })
  declare id?: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare updatedAt: Date;

  @ForeignKey(() => PersonModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare personId: string;

  @BelongsTo(() => PersonModel)
  declare person: PersonModel;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
  })
  declare label?: string | null;

  @Column({
    type: DataType.SMALLINT,
    allowNull: false,
  })
  declare status: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isVerified: boolean;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
  })
  declare type: string;

  @Column({
    type: DataType.STRING(256),
    allowNull: false,
  })
  declare value: string;
}
```

---

# PersonNotificationSettingsModel

```ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { PersonModel } from './person.model';
import { PersonChannelModel } from './person-channel.model';

export interface IPersonNotificationSettings {
  id?: number;

  createdAt: Date;
  updatedAt: Date;

  personId: string;

  status: number;
  type: string;

  personChannelId: number;

  quietRanges: unknown;
}

@Table({
  tableName: 'person_notification_settings',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',

  indexes: [
    {
      unique: true,
      fields: ['person_id', 'type', 'person_channel_id'],
      name: 'indxpns_person_type_channel',
    },
    {
      fields: [
        'person_id',
        'type',
        'status',
        'person_channel_id',
      ],
      name: 'indxpns_person_type_status_channel',
    },
  ],
})
export class PersonNotificationSettingsModel
  extends Model<IPersonNotificationSettings>
  implements IPersonNotificationSettings
{
  @Column({
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    unique: true,
    type: DataType.BIGINT,
  })
  declare id?: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare updatedAt: Date;

  @ForeignKey(() => PersonModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare personId: string;

  @BelongsTo(() => PersonModel)
  declare person: PersonModel;

  @Column({
    type: DataType.SMALLINT,
    allowNull: false,
  })
  declare status: number;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
  })
  declare type: string;

  @ForeignKey(() => PersonChannelModel)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  declare personChannelId: number;

  @BelongsTo(() => PersonChannelModel)
  declare channel: PersonChannelModel;

  @Column({
    type: 'int4multirange' as any,
    allowNull: false,
    defaultValue: [],
  })
  declare quietRanges: unknown;
}
```
