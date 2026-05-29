import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { enumValues } from 'src/modules/common/utils';
import { ChannelType, NotificationStatus, NotificationType, PersonChannelStatus } from 'src/core/repositories/postgres';
import { DatetimeHelper } from 'src/core/app';

export const allowedNotificationTypes = enumValues(NotificationType);
export const allowedChannelTypes = enumValues(ChannelType);
export const allowedChannelStatus = enumValues(PersonChannelStatus);
export const allowedNotificationStatus = enumValues(NotificationStatus);

// ==========================================
// ResponseDto
// ==========================================

export enum ResponseStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  ALLOW = 'allow',
  DENY = 'deny',
}

export class BaseResponseDto<T = unknown> {
  @ApiProperty({ description: 'Статус ответа', enum: ResponseStatus, example: ResponseStatus.SUCCESS })
  status!: ResponseStatus;

  @ApiProperty({ description: 'Детали ошибки (если есть)', example: 'Детали не указаны' })
  @IsOptional()
  @IsString()
  details?: string;

  data?: T;
}

// ==========================================
// Base RequestDto
// ==========================================

export class BaseIdRequestDto {
  @ApiProperty({
    type: String,
    description: 'ID (UUID)',
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID('4')
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  id!: string;
}

export class BaseRegionCodeRequestDto {
  @ApiProperty({
    type: String,
    description: 'Код региона (ISO 2)',
    example: 'RU',
    default: 'RU',
    required: true,
  })
  @IsString()
  @Length(2, 2)
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  regionCode!: string;
}

export class BaseNotificationFieldsRequestDto extends PartialType(BaseRegionCodeRequestDto) {
  @ApiProperty({
    description: 'Типы уведомлений',
    enum: NotificationType,
    example: NotificationType.MARKETING,
    required: true,
  })
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsIn(allowedNotificationTypes, {
    message: `Указан неверный тип уведомления. Допустимые значения: ${allowedNotificationTypes.join(', ')}`,
  })
  notificationType!: NotificationType;

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
  channelType!: ChannelType;
}

export class BaseNotificationStatusRequestDto {
  @ApiProperty({
    description: 'Статус (0 - DISABLED, 1 - ACTIVE)',
    enum: NotificationStatus,
    example: NotificationStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? undefined : Number(trimmed);
    }
    return value;
  })
  @IsIn(allowedNotificationStatus, {
    message: `Указан неверный статус. Допустимые значения: ${allowedNotificationStatus.join(', ')}`,
  })
  status?: NotificationStatus;
}

export class QuietRangesRequestData {
  @ApiProperty({
    description: 'Начало периода тишины (HH:mm)',
    example: '22:00',
    default: '22:00',
    required: true,
  })
  @Transform(({ value }) => (typeof value === 'string' ? DatetimeHelper.timeToMinutes(value) : value))
  @ValidateIf((o) => o.quietFinish !== undefined && o.quietFinish !== null && o.quietFinish !== '')
  @IsInt({ message: 'Должно быть в формате HH:mm (например, 14:30)' })
  @Min(0, { message: 'Минимальное значение — 00:00' })
  @Max(1440, { message: 'Максимальное значение  — 24:00' })
  quietStart!: number;

  @ApiProperty({
    description: 'Окончание тишины (HH:mm)',
    example: '08:00',
    default: '08:00',
    required: true,
  })
  @Transform(({ value }) => (typeof value === 'string' ? DatetimeHelper.timeToMinutes(value) : value))
  @ValidateIf((o) => o.quietStart !== undefined && o.quietStart !== null && o.quietStart !== '')
  @IsInt({ message: 'Должно быть в формате HH:mm (например, 14:30)' })
  @Min(0, { message: 'Минимальное значение — 00:00' })
  @Max(1440, { message: 'Максимальное значение  — 24:00' })
  quietFinish!: number;
}

export class QuietRangesRequestDto {
  @ApiProperty({
    description: 'Период тишины по умолчанию',
    type: QuietRangesRequestData,
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => o.quietRanges !== undefined && o.quietRanges !== null)
  @ValidateNested()
  @Type(() => QuietRangesRequestData)
  quietRanges?: QuietRangesRequestData;
}

// ==========================================
// Base ResponseDto
// ==========================================

export class BaseIdResponseDto {
  @ApiProperty({
    type: String,
    description: 'ID (UUID)',
    example: '00000000-0000-0000-0000-000000000000',
  })
  id!: string;
}

export class BaseRegionCodeResponseDto {
  @ApiProperty({
    type: String,
    description: 'Код региона (ISO 2)',
    example: 'RU',
  })
  regionCode!: string;
}

export class QuietRangesResponseData {
  @ApiProperty({
    description: 'Начало периода тишины (HH:mm)',
    example: '22:00',
  })
  quietStart!: string;

  @ApiProperty({
    description: 'Окончание тишины (HH:mm)',
    example: '08:00',
  })
  quietFinish!: string;
}

export class QuietRangesResponseDto {
  @ApiProperty({
    description: 'Период тишины',
    type: QuietRangesResponseData,
  })
  quietRanges!: QuietRangesResponseData;
}
