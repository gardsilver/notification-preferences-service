nodejs v24, @nestjs/sequelize 11.0.1, PostgreSQL

//// person
      await queryInterface.createTable(
        'person', 
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.literal('gen_random_uuid()'),
            unique: true,
            allowNull: false,
            primaryKey: true,
            comment: 'primaryKey',
          },
          created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('now()'),
            comment: 'Дата создания записи'
          },
          updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('now()'),
            comment: 'Дата изменения записи'
          },
          region_code: {
            type: DataTypes.STRING({ length: 2 }),
            allowNull: false,
            defaultValue: 'RU',
            comment: 'Код региона (ISO 3166-1 alpha-2)'
          },
          timezone: {
            type: DataTypes.STRING({ length: 60 }),
            allowNull: false,
            defaultValue: 'UTC',
            comment: 'Код региона (ISO 3166-1 alpha-2)'
          },
          birthday: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: 'День рождения'
          },
          last_name: {
            type: DataTypes.STRING({ length: 64 }),
            allowNull: false,
            comment: 'Фамилия'
          },
          first_name: {
            type: DataTypes.STRING({ length: 64 }),
            allowNull: false,
            comment: 'Имя'
          },
          middle_name: {
            type: DataTypes.STRING({ length: 64 }),
            allowNull: true,
            comment: 'Отчество'
          },
        }, 
        {
          transaction,
          comment: 'Таблица персональных данных пользователя'
        }
      );


	  
//// person_channel
      await queryInterface.createTable(
        'person_channel', 
        {
          id: {
            type: DataTypes.BIGINT,
            unique: true,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            comment: 'primaryKey'
          },
          created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('now()'),
            comment: 'Дата создания записи'
          },
          updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('now()'),
            comment: 'Дата изменения записи'
          },
          person_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: 'person', 
              key: 'id'
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE' 
          },
          label: {
            type: DataTypes.STRING({ length: 64 }),
            allowNull: true,
            comment: 'Метка канала'
          },
          status: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            comment: 'Status канала'
          },
          is_verified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            comment: 'Признак верификации канала'
          },
          type: {
            type: DataTypes.STRING({ length: 64 }),
            allowNull: false,
            comment: 'Тип канала'
          },
          value: {
            type: DataTypes.STRING({ length: 256 }),
            allowNull: false,
            comment: 'Индикатор канала (email, телефон и т.д)'
          },
        }, 
        {
          transaction,
          comment: 'Таблица каналов связи с пользователем'
        }
      );

      await queryInterface.addConstraint('person_channel', {
        type: 'CHECK',
        fields: ['id'],
        name: 'indxpc_check_min_id',
        where: {
          id: {
            [Op.gte]: 0
          }
        },
        transaction
      });

      // type и value должны быть глобально уникальны, 
      // не допустимо использование одного и того же канала для разных пользователей
      await queryInterface.addIndex('person_channel', ['type', 'value'], {
        name: 'indxpc_type_value',
        unique: true,
        transaction,
      });

      await queryInterface.addIndex(
        'person_channel',
        ['type', 'status', 'is_verified'],
        {
          name: 'indxpc_type_status_verified',
          transaction
        }
      );

//// person_notification_settings

      await queryInterface.createTable(
        'person_notification_settings', 
        {
          id : {
            type: DataTypes.BIGINT,
            unique: true,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            comment: 'primaryKey'
          },
          created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('now()'),
            comment: 'Дата создания записи'
          },
          updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('now()'),
            comment: 'Дата изменения записи'
          },
          person_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: 'person', 
              key: 'id'
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE' 
          },
          status: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            comment: 'Status уведомления'
          },
          type: {
            type: DataTypes.STRING({ length: 64 }),
            allowNull: false,
            comment: 'Type уведомления'
          },
          person_channel_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
              model: 'person_channel',
              key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          },
        }, 
        {
          transaction,
          comment: 'Таблица настроек уведомлений для пользователя'
        }
      );

      await queryInterface.sequelize.query(`
        ALTER TABLE person_notification_settings
        ADD COLUMN quiet_ranges int4multirange NOT NULL DEFAULT '{}'
      `, {
        transaction
      });

      await queryInterface.sequelize.query(`
        COMMENT ON COLUMN person_notification_settings.quiet_ranges
        IS 'Период тихого часа (проверка отключена, если upper = lower)'
      `, {
        transaction
      });

      await queryInterface.addConstraint('person_notification_settings', {
        type: 'CHECK',
        fields: ['id'],
        name: 'indxpns_check_min_id',
        where: {
          id: {
            [Op.gte]: 0
          }
        },
        transaction
      });

      await queryInterface.sequelize.query(`
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
        )
      `, {
        transaction
      });

      await queryInterface.sequelize.query(`
        CREATE INDEX indxpns_gist_quiet_ranges
        ON person_notification_settings
        USING GIST (quiet_ranges)
      `, {
        transaction
      });

      // Индек консистентности данных
      await queryInterface.addIndex(
        'person_notification_settings', 
        ['person_id', 'type', 'person_channel_id'],
        {
          name: 'indxpns_person_type_channel',
          unique: true,
          transaction,
        }
      );

      // Индекс для поиска
      await queryInterface.addIndex(
        'person_notification_settings', 
        ['person_id', 'type', 'status', 'person_channel_id'],
        {
          name: 'indxpns_person_type_status_channel',
          transaction,
        }
      );

Через API передаем параметры:
  -	person_id
  - notification_type (например 'marketing')
  - channel_type (например 'email')
  - region (в формате ISO 3166-1 alpha-2, например 'EU') 
  - datetime (в UTC-формате)

Задача: 
 
1) Выполнить запрос для вычисления person_minute (который можно проверить на соответвие quiet_ranges в запросе ниже)
 
2) Как настроить индексы и построить запрос проверки возможности отправки уведомления для заданных парамеров: 
 - person_notification_settings.person_id = :person_id,
 - типа уведомления (person_notification_settings.type = :notification_type),
 - канала (person_channel.type = :channel_type)
 - региона (person.region_code = :region)
 - на указанное person_datetime

3) Построить entities для указанных талиц (Person, PersonChannel, PersonNotificationSettings) по шаблону:

import { Column, Model, DataType, Table } from 'sequelize-typescript';
import { IUser } from '../types/types';

// Описания бозовых интерфейсов
export interface IIdentityUser {
  id?: number;
  name: string;
}

export interface IUser extends IIdentityUser {
  id?: number;
  createdAt: Date;
  updatedAt: Date;
  name: string;
}

// Реализация непосредвсенно модели
@Table({
  tableName: 'users',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['name'],
      name: 'indx_users_name',
    },
  ],
})
export class UserModel extends Model<IUser> implements IUser {
  @Column({
    primaryKey: true,
    unique: true,
    autoIncrement: true,
    allowNull: false,
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

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;
}

 