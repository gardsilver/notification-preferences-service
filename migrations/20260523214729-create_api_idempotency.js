'use strict';
const { DataTypes, Op } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
            
    try {
      await queryInterface.createTable(
        'api_idempotency', 
        {
          id : {
            type: DataTypes.STRING({ length: 128 }),
            unique: true,
            allowNull: false,
            primaryKey: true,
            comment: 'primaryKey (Ключь идемпотентности запросов)',
          },
          created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('now()'),
            comment: 'Дата создания записи'
          },
          request_hash : {
            type: DataTypes.STRING({ length: 64 }),
            allowNull: false,
            comment: 'Кэш запроса'
          },
          response_code: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            comment: 'Код ответа'
          },
          response_body: {
            type: DataTypes.JSONB,
            allowNull: false,
            comment: 'Тело ответа'
          }
        }, 
        {
          transaction,
          comment: 'Таблица идемпотентности API-запросов'
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
