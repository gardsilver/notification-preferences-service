'use strict';
const { DataTypes, Op } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
        
    try {
      await queryInterface.createTable(
        'person_channel', 
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

      // type и value должны быть глобально уникальны, 
      // не допустимо использование одного и того же канала для разных пользователей
      await queryInterface.addIndex('person_channel', ['type', 'value'], {
        name: 'indxpc_type_value',
        unique: true,
        transaction,
      });

      await queryInterface.addIndex(
        'person_channel',
        ['type', 'status', 'is_verified', 'id'],
        {
          name: 'indxpc_type_status_verified_id',
          transaction
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
