import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { IPersonChannel, PersonChannelStatus, ChannelType } from '../types/types';
import { PersonModel } from './person.model';
import { PersonChannelNotificationSettingsModel } from './person-channel-notification-settings.model';

@Table({
  tableName: 'person_channel',
  underscored: true,
  timestamps: true,

  indexes: [
    {
      unique: true,
      fields: ['type', 'value'],
      name: 'indxpc_type_value',
    },
    {
      fields: ['type', 'status', 'is_verified', 'id'],
      name: 'indxpc_lookup2',
    },
  ],
})
export class PersonChannelModel extends Model<IPersonChannel> implements IPersonChannel {
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

  @ForeignKey(() => PersonModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare personId: string;

  @BelongsTo(() => PersonModel)
  declare person: PersonModel;

  @Column({
    type: DataType.STRING(64),
  })
  declare label?: string | null;

  @Column({
    type: DataType.SMALLINT,
    allowNull: false,
  })
  declare status: PersonChannelStatus;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isVerified: boolean;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
  })
  declare type: ChannelType;

  @Column({
    type: DataType.STRING(256),
    allowNull: false,
  })
  declare value: string;

  @HasMany(() => PersonChannelNotificationSettingsModel)
  declare settings: PersonChannelNotificationSettingsModel[];
}
