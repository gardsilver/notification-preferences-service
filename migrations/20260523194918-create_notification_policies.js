'use strict';
const { DataTypes, Op } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
            
    try {
      await queryInterface.createTable(
        'notification_policies', 
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
          status: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            comment: 'Status политики'
          },
          notification_type: {
            type: DataTypes.STRING({ length: 64 }),
            allowNull: false,
            comment: 'Type уведомления'
          },
          channel_type: {
            type: DataTypes.STRING({ length: 64 }),
            allowNull: false,
            comment: 'Тип канала'
          },
          region_code: {
            type: DataTypes.STRING({ length: 2 }),
            allowNull: false,
            defaultValue: 'RU',
            comment: 'Код региона (ISO 3166-1 alpha-2)'
          }
        }, 
        {
          transaction,
          comment: 'Таблица настроек глобальных политик'
        }
      );

      await queryInterface.addIndex('notification_policies', ['channel_type', 'notification_type', 'region_code'], {
        name: 'indxnp_channel_notification_region',
        unique: true,
        transaction,
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
