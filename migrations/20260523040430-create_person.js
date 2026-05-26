'use strict';
const { DataTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
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
            comment: 'Timezone (IANA)'
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
