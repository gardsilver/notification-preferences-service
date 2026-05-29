import { ApiProperty, PartialType, OmitType, IntersectionType } from '@nestjs/swagger';
import { IsString, IsIn, IsNotEmpty, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ChannelType, PersonChannelStatus } from 'src/core/repositories/postgres';
import { IsChannelValue } from '../validators/person-channel.validator';
import {
  ChannelSettingsRequestData,
  ChannelSettingsResponseData,
  UpdateChannelSettingsRequestData,
} from './person-channel-settings.dto';
import { allowedChannelStatus, allowedChannelTypes, BaseIdRequestDto, BaseIdResponseDto } from './base.dto';

// ==========================================
// Create RequestDto
// ==========================================

export class CreatePersonChannelRequestDto {
  @ApiProperty({ type: String, description: 'Метка канала оповещения', example: 'Рабочий', required: false })
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
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? undefined : Number(trimmed);
    }
    return value;
  })
  @IsIn(allowedChannelStatus, {
    message: `Указан неверный статус канала оповещения. Допустимые значения: ${allowedChannelStatus.join(', ')}`,
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
  @IsIn(allowedChannelTypes, {
    message: `Указан неверный тип канала оповещения. Допустимые значения: ${allowedChannelTypes.join(', ')}`,
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
    description: 'Типы уведомлений, привязанные к этому канале',
    type: [ChannelSettingsRequestData],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChannelSettingsRequestData)
  settings?: ChannelSettingsRequestData[];
}

// ==========================================
// Update RequestDto
// ==========================================

export class UpdatePersonChannelRequestData extends IntersectionType(
  PartialType(BaseIdRequestDto),
  PartialType(OmitType(CreatePersonChannelRequestDto, ['settings'] as const)),
) {
  // 3. Подмешиваем массив настроек с типом для обновления (Update) вместо создания (Create)
  @ApiProperty({
    description: 'Типы уведомлений, привязанные к этому каналу',
    type: [UpdateChannelSettingsRequestData],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateChannelSettingsRequestData)
  settings?: UpdateChannelSettingsRequestData[];
}

// ==========================================
// ResponseData
// ==========================================

export class PersonChannelResponseData extends BaseIdResponseDto {
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
    type: [ChannelSettingsResponseData],
  })
  settings!: ChannelSettingsResponseData[];
}
