import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUUID,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { enumValues } from 'src/modules/common/utils';
import { ChannelType, PersonChannelStatus } from 'src/core/repositories/postgres';
import { IsChannelValue } from '../validators/person-channel.validator';
import { ChannelSettingsRequestData, ChannelSettingsResponseData } from './person-channel-settings.dto';

const allowedPersonChannelTypes = enumValues(ChannelType);
const allowedPersonChannelStatus = enumValues(PersonChannelStatus);

// Create Request

export class CreatePersonChannelRequestDto {
  @ApiProperty({ type: String, description: 'Метка канала оповещения', example: 'Рабочий' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  label?: string;

  @ApiProperty({
    description: 'Статус канала оповещения',
    enum: PersonChannelStatus,
    example: PersonChannelStatus.ACTIVE,
    required: true,
  })
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.trim().toLowerCase();
    return value;
  })
  @IsIn(allowedPersonChannelStatus, {
    message: `Указан неверный статус канала оповещения. Допустимые значения: ${allowedPersonChannelStatus.join(', ')}`,
  })
  status!: PersonChannelStatus;

  @ApiProperty({
    description: 'Признак верификации канала оповещения',
    type: Boolean,
    example: false,
    default: false,
  })
  @IsNotEmpty()
  @IsBoolean({ message: 'isVerified должно быть логическим значением (true/false)' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  isVerified!: boolean;

  @ApiProperty({
    description: 'Тип канала оповещения',
    enum: ChannelType,
    example: ChannelType.EMAIL,
    required: true,
  })
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsIn(allowedPersonChannelTypes, {
    message: `Указан неверный тип канала оповещения. Допустимые значения: ${allowedPersonChannelTypes.join(', ')}`,
  })
  type!: ChannelType;

  @ApiProperty({
    type: String,
    description: 'Адресат канала оповещения',
    example: 'user@example.com',
    required: true,
  })
  @IsNotEmpty({ message: 'Значение канала связи не может быть пустым' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsChannelValue()
  value!: string;

  @ApiProperty({
    description: 'Типы уведомлений, привязанные к этому каналу',
    type: [ChannelSettingsRequestData],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChannelSettingsRequestData)
  settings?: ChannelSettingsRequestData[];
}

// Update Request

export class UpdatePersonChannelRequestData {
  @ApiProperty({
    type: String,
    description: 'ID (UUID)',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsString()
  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  id?: string;

  @ApiProperty({ type: String, description: 'Метка канала оповещения', example: 'Рабочий' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  label?: string;

  @ApiProperty({
    description: 'Статус канала оповещения',
    enum: PersonChannelStatus,
    example: PersonChannelStatus.ACTIVE,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.trim().toLowerCase();
    return value;
  })
  @IsIn(allowedPersonChannelStatus, {
    message: `Указан неверный статус канала оповещения. Допустимые значения: ${allowedPersonChannelStatus.join(', ')}`,
  })
  status?: PersonChannelStatus;

  @ApiProperty({
    description: 'Признак верификации канала оповещения',
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isVerified должно быть логическим значением (true/false)' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  isVerified?: boolean;

  @ApiProperty({
    description: 'Тип канала оповещения',
    enum: ChannelType,
    example: ChannelType.EMAIL,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsIn(allowedPersonChannelTypes, {
    message: `Указан неверный тип канала оповещения. Допустимые значения: ${allowedPersonChannelTypes.join(', ')}`,
  })
  type?: ChannelType;

  @ApiProperty({
    type: String,
    description: 'Адресат канала оповещения',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsChannelValue()
  value?: string;

  @ApiProperty({
    description: 'Типы уведомлений, привязанные к этому каналу',
    type: [ChannelSettingsRequestData],
  })
  @IsOptional()
  @ValidateIf((o, v) => Array.isArray(v))
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChannelSettingsRequestData)
  settings?: ChannelSettingsRequestData[];
}

// Response

export class PersonChannelResponseData {
  @ApiProperty({
    type: String,
    description: 'ID (UUID)',
    example: '00000000-0000-0000-0000-000000000000',
  })
  id?: string;

  @ApiProperty({ type: String, description: 'Метка канала оповещения', example: 'Рабочий' })
  label?: string;

  @ApiProperty({
    description: 'Статус канала оповещения',
    enum: PersonChannelStatus,
  })
  status!: PersonChannelStatus;

  @ApiProperty({
    description: 'Признак верификации канала оповещения',
    type: Boolean,
  })
  isVerified!: boolean;

  @ApiProperty({
    description: 'Тип канала оповещения',
    enum: ChannelType,
  })
  type!: ChannelType;

  @ApiProperty({
    type: String,
    description: 'Адресат канала оповещения',
  })
  value!: string;

  @ApiProperty({
    description: 'Типы уведомлений, привязанные к этому каналу',
    type: ChannelSettingsResponseData,
  })
  settings!: ChannelSettingsResponseData[];
}
