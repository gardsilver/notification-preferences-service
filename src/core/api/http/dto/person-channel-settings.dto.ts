import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, ValidateIf, IsInt, Min, Max, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { enumValues } from 'src/modules/common/utils';
import { DatetimeHelper } from 'src/core/app';
import { NotificationType, NotificationStatus } from 'src/core/repositories/postgres';

const allowedPersonNotificationTypes = enumValues(NotificationType);
const allowedPersonNotificationStatus = enumValues(NotificationStatus);

// Create Request

export class QuietRangesRequestData {
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

export class ChannelSettingsRequestData {
  @ApiProperty({
    description: 'Типы уведомлений, привязанные к этому каналу',
    enum: NotificationType,
    required: true,
  })
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.trim().toLowerCase();
    return value;
  })
  @IsIn(allowedPersonNotificationTypes, {
    message: `Указан неверный тип уведомления. Допустимые значения: ${allowedPersonNotificationTypes.join(', ')}`,
  })
  type!: NotificationType;

  @ApiProperty({
    description: 'Статус подписки на тип уведомления',
    enum: NotificationStatus,
    example: NotificationStatus.ACTIVE,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.trim().toLowerCase();
    return value;
  })
  @IsIn(allowedPersonNotificationStatus, {
    message: `Указан неверный статус подписки на тип уведомления. Допустимые значения: ${allowedPersonNotificationStatus.join(', ')}`,
  })
  status?: NotificationStatus;

  @ApiProperty({
    type: QuietRangesRequestData,
  })
  @ValidateNested()
  @Type(() => QuietRangesRequestData)
  quietRanges!: QuietRangesRequestData;
}

// Response

export class QuietRangesResponseData {
  @ApiProperty({
    description: 'Начало периода тишины (HH:mm)',
  })
  quietStart!: string;

  @ApiProperty({
    description: 'Окончание тишины (HH:mm)',
  })
  quietFinish!: string;
}

export class ChannelSettingsResponseData {
  @ApiProperty({
    description: 'Статус подписки на тип уведомления',
    enum: NotificationStatus,
  })
  status!: NotificationStatus;

  @ApiProperty({
    description: 'Типы уведомлений, привязанные к этому каналу',
    enum: NotificationType,
    isArray: true,
  })
  type!: NotificationType;

  @ApiProperty({
    description: 'Период тишины',
    type: QuietRangesResponseData,
  })
  quietRanges!: QuietRangesResponseData;
}
