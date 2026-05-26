'use strict';
const { DataTypes, Op } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
            
    try {
      await queryInterface.createTable(
        'notification_default_settings', 
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
          type: {
            type: DataTypes.STRING({ length: 64 }),
            allowNull: false,
            unique: true,
            comment: 'Type уведомления'
          },
        }, 
        {
          transaction,
          comment: 'Таблица настроек уведомлений по умолчанию'
        }
      );

      await queryInterface.sequelize.query(`
        ALTER TABLE notification_default_settings
        ADD COLUMN quiet_ranges int4multirange NOT NULL DEFAULT '{}'::int4multirange
      `, {
        transaction
      });

      await queryInterface.sequelize.query(`
        COMMENT ON COLUMN notification_default_settings.quiet_ranges
        IS 'Период тихого часа (Проверка отключена, если upper = lower. Значения в минутах: <=1440)'
      `, {
        transaction
      });

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
