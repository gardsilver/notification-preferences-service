/* eslint-disable @typescript-eslint/no-explicit-any */
import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { INotificationDefaultSettings, NotificationType } from '../types/types';

@Table({
  tableName: 'notification_default_settings',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['type'],
      name: 'notification_default_settings_type_key', // Название уникального индекса для type
    },
  ],
})
export class NotificationDefaultSettingsModel
  extends Model<INotificationDefaultSettings>
  implements INotificationDefaultSettings
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
  })
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
  })
  declare updatedAt: Date;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    unique: true,
  })
  declare type: NotificationType;

  @Column({
    type: 'int4multirange' as any, // Используем as any, чтобы обойти отсутствие типа в DataType Sequelize
    allowNull: false,
    defaultValue: '[]',
  })
  declare quietRanges: unknown;
}
