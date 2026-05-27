import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { enumValues } from 'src/modules/common/utils';
import { DatetimeHelper } from 'src/core/app';
import { NotificationType } from 'src/core/repositories/postgres';

const allowedNotificationTypes = enumValues(NotificationType);

// Create Request

export class CreateNotificationDefaultSettingsRequestDto {
  @ApiProperty({
    description: 'Информационный канал',
    enum: NotificationType,
    example: NotificationType.MARKETING,
    required: true,
  })
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim()?.toLowerCase() : value))
  @IsIn(allowedNotificationTypes, {
    message: `Указан неверный информационный канал. Допустимые значения: ${allowedNotificationTypes.join(', ')}`,
  })
  type!: NotificationType;

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

// Update Request

export class UpdateNotificationDefaultSettingsRequestDto {
  @ApiProperty({
    type: String,
    description: 'ID (UUID)',
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  id!: string;

  @ApiProperty({
    description: 'Информационный канал',
    enum: NotificationType,
    example: NotificationType.MARKETING,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim()?.toLowerCase() : value))
  @IsIn(allowedNotificationTypes, {
    message: `Указан неверный информационный канал. Допустимые значения: ${allowedNotificationTypes.join(', ')}`,
  })
  type?: NotificationType;

  @ApiProperty({
    description: 'Начало периода тишины (HH:mm)',
    example: '22:00',
    default: '22:00',
  })
  @Transform(({ value }) => (typeof value === 'string' ? DatetimeHelper.timeToMinutes(value) : value))
  @ValidateIf((o) => o.quietFinish !== undefined && o.quietFinish !== null && o.quietFinish !== '')
  @IsInt({ message: 'Должно быть в формате HH:mm (например, 14:30)' })
  @Min(0, { message: 'Минимальное значение — 00:00' })
  @Max(1440, { message: 'Максимальное значение  — 24:00' })
  quietStart?: number;

  @ApiProperty({
    description: 'Окончание тишины (HH:mm)',
    example: '08:00',
    default: '08:00',
  })
  @Transform(({ value }) => (typeof value === 'string' ? DatetimeHelper.timeToMinutes(value) : value))
  @ValidateIf((o) => o.quietStart !== undefined && o.quietStart !== null && o.quietStart !== '')
  @IsInt({ message: 'Должно быть в формате HH:mm (например, 14:30)' })
  @Min(0, { message: 'Минимальное значение — 00:00' })
  @Max(1440, { message: 'Максимальное значение  — 24:00' })
  quietFinish?: number;
}

// Response

export class NotificationDefaultSettingsResponseData {
  @ApiProperty({
    type: String,
    description: 'ID (UUID)',
    example: '00000000-0000-0000-0000-000000000000',
  })
  id!: string;

  @ApiProperty({
    description: 'Информационный канал',
    enum: NotificationType,
  })
  type!: NotificationType;

  @ApiProperty({
    description: 'Начало периода тишины (HH:mm)',
  })
  quietStart!: string;

  @ApiProperty({
    description: 'Окончание тишины (HH:mm)',
  })
  quietFinish!: string;
}
