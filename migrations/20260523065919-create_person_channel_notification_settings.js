'use strict';
const { DataTypes, Op } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
            
    try {
      await queryInterface.createTable(
        'person_channel_notification_settings', 
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
            type: DataTypes.UUID,
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
        ALTER TABLE person_channel_notification_settings
        ADD COLUMN quiet_ranges int4multirange NOT NULL DEFAULT '{}'::int4multirange
      `, {
        transaction
      });

      await queryInterface.sequelize.query(`
        COMMENT ON COLUMN person_channel_notification_settings.quiet_ranges
        IS 'Период тихого часа (Проверка отключена, если upper = lower. Значения в минутах: <=1440)'
      `, {
        transaction
      });

      await queryInterface.addConstraint('person_channel_notification_settings', {
        type: 'CHECK',
        fields: ['id'],
        name: 'indxpcns_check_min_id',
        where: {
          id: {
            [Op.gte]: 0
          }
        },
        transaction
      });

      await queryInterface.sequelize.query(`
        CREATE INDEX indxpcns_gist_quiet_ranges
        ON person_channel_notification_settings
        USING GIST (quiet_ranges)
      `, {
        transaction
      });

      // Индек консистентности данных
      await queryInterface.addIndex(
        'person_channel_notification_settings', 
        ['type', 'person_channel_id'],
        {
          name: 'indxpcns_type_channel',
          unique: true,
          transaction,
        }
      );

      // Индекс для поиска
      await queryInterface.addIndex(
        'person_channel_notification_settings', 
        ['type', 'status', 'person_channel_id'],
        {
          name: 'indxpcns_type_status_channel',
          transaction,
        }
      );

      transaction.commit();
    } catch (e) {
      transaction.rollback();

      throw e;
    }
  },

  async down (queryInterface, Sequelize) {
    throw new Error('Откат миграции запрещен')
  }
};
