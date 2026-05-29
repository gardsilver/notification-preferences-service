import { ApiProperty, PartialType, OmitType, IntersectionType } from '@nestjs/swagger';
import { NotificationStatus } from 'src/core/repositories/postgres';
import { BaseNotificationStatusRequestDto, QuietRangesRequestDto } from './base.dto';
import {
  CreateNotificationDefaultSettingsRequestDto,
  NotificationDefaultSettingsResponseData,
} from './notification-default-settings.dto';

// ==========================================
// Create RequestDto
// ==========================================

export class ChannelSettingsRequestData extends IntersectionType(
  CreateNotificationDefaultSettingsRequestDto,
  BaseNotificationStatusRequestDto,
) {}

// ==========================================
// Update RequestDto
// ==========================================

export class UpdateChannelSettingsRequestData extends IntersectionType(
  PartialType(OmitType(ChannelSettingsRequestData, ['quietRanges'] as const)),
  PartialType(QuietRangesRequestDto),
) {}

// ==========================================
// ResponseData
// ==========================================

export class ChannelSettingsResponseData extends OmitType(NotificationDefaultSettingsResponseData, ['id'] as const) {
  @ApiProperty({
    description: 'Статус подписки на тип уведомления',
    enum: NotificationStatus,
    example: NotificationStatus.ACTIVE,
  })
  status!: NotificationStatus;
}
