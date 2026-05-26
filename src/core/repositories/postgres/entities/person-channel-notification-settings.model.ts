/* eslint-disable @typescript-eslint/no-explicit-any */
import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { IPersonChannelNotificationSettings, NotificationStatus, NotificationType } from '../types/types';
import { PersonChannelModel } from './person-channel.model';

@Table({
  tableName: 'person_channel_notification_settings',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',

  indexes: [
    {
      unique: true,
      fields: ['type', 'person_channel_id'],
      name: 'indxpcns_type_channel',
    },
    {
      fields: ['type', 'status', 'person_channel_id'],
      name: 'indxpcns_type_status_channel',
    },
  ],
})
export class PersonChannelNotificationSettingsModel
  extends Model<IPersonChannelNotificationSettings>
  implements IPersonChannelNotificationSettings
{
  @Column({
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    unique: true,
    type: DataType.BIGINT,
  })
  declare id?: string; // @TODO Ограничение BIGINT!

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
  declare type: NotificationType;

  @ForeignKey(() => PersonChannelModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare personChannelId: string;

  @BelongsTo(() => PersonChannelModel)
  declare channel: PersonChannelModel;

  @Column({
    type: 'int4multirange' as any,
    allowNull: false,
    defaultValue: [],
  })
  declare quietRanges: unknown;
}
