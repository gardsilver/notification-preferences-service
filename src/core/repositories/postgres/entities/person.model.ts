import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { IPerson } from '../types/types';
import { PersonChannelModel } from './person-channel.model';

@Table({
  tableName: 'person',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',

  indexes: [
    {
      fields: ['region_code', 'id'],
      name: 'indxp_region_person',
    },
  ],
})
export class PersonModel extends Model<IPerson> implements IPerson {
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
    type: DataType.STRING(2),
    allowNull: false,
    defaultValue: 'RU',
  })
  declare regionCode: string;

  @Column({
    type: DataType.STRING(60),
    allowNull: false,
    defaultValue: 'UTC',
  })
  declare timezone: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare birthday: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
  })
  declare lastName: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
  })
  declare firstName: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
  })
  declare middleName?: string | null;

  @HasMany(() => PersonChannelModel)
  declare channels: PersonChannelModel[];
}
