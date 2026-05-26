/* eslint-disable @typescript-eslint/no-explicit-any */
import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { IApiIdempotency } from '../types/types';

@Table({
  tableName: 'api_idempotency',
  timestamps: false,
  underscored: true,
})
export class ApiIdempotencyModel extends Model implements IApiIdempotency {
  @Column({
    primaryKey: true,
    type: DataType.STRING(128),
    allowNull: false,
  })
  declare id: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
  })
  declare requestHash: string;

  @Column({
    type: DataType.SMALLINT,
    allowNull: false,
  })
  declare responseCode: number;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  declare responseBody: any;
}
