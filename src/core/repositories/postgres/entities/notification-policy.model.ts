import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { ChannelType, INotificationPolicy, NotificationStatus, NotificationType } from '../types/types';

@Table({
  tableName: 'notification_policies',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',

  indexes: [
    {
      unique: true,
      fields: ['channel_type', 'notification_type', 'region_code'],
      name: 'indxnp_channel_notification_region',
    },
  ],
})
export class NotificationPolicyModel extends Model<INotificationPolicy> implements INotificationPolicy {
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
    type: DataType.SMALLINT,
    allowNull: false,
  })
  declare status: NotificationStatus;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
  })
  declare notificationType: NotificationType;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
  })
  declare channelType: ChannelType;

  @Column({
    type: DataType.STRING(2),
    allowNull: false,
    defaultValue: 'RU',
  })
  declare regionCode: string;
}
