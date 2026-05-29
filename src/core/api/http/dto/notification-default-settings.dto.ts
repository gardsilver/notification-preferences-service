import { ApiProperty, IntersectionType, PartialType } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { NotificationType } from 'src/core/repositories/postgres';
import {
  allowedNotificationTypes,
  BaseIdRequestDto,
  BaseIdResponseDto,
  QuietRangesRequestDto,
  QuietRangesResponseDto,
} from './base.dto';

// ==========================================
// Create RequestDto
// ==========================================

export class CreateNotificationDefaultSettingsRequestDto extends IntersectionType(QuietRangesRequestDto) {
  @ApiProperty({
    description: 'Информационный канал / тип уведомления',
    enum: NotificationType,
    example: NotificationType.MARKETING,
    required: true,
  })
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsIn(allowedNotificationTypes, {
    message: `Указан неверный информационный канал. Допустимые значения: ${allowedNotificationTypes.join(', ')}`,
  })
  type!: NotificationType;
}

// ==========================================
// Update RequestDto
// ==========================================

export class UpdateNotificationDefaultSettingsRequestDto extends IntersectionType(
  BaseIdRequestDto,
  PartialType(CreateNotificationDefaultSettingsRequestDto),
) {}

// ==========================================
// ResponseData
// ==========================================

export class NotificationDefaultSettingsResponseData extends IntersectionType(
  BaseIdResponseDto,
  QuietRangesResponseDto,
) {
  @ApiProperty({
    description: 'Информационный канал',
    enum: NotificationType,
    example: NotificationType.MARKETING,
  })
  type!: NotificationType;
}
