import { ApiProperty, PartialType, IntersectionType } from '@nestjs/swagger';
import { ChannelType, NotificationStatus, NotificationType } from 'src/core/repositories/postgres';
import {
  BaseIdRequestDto,
  BaseIdResponseDto,
  BaseNotificationFieldsRequestDto,
  BaseNotificationStatusRequestDto,
  BaseRegionCodeResponseDto,
} from './base.dto';

// ==========================================
// Create RequestDto
// ==========================================

export class CreateNotificationPolicyRequestDto extends IntersectionType(
  BaseNotificationFieldsRequestDto,
  BaseNotificationStatusRequestDto,
) {}

// ==========================================
// Update RequestDto
// ==========================================

export class UpdateNotificationPolicyRequestDto extends IntersectionType(
  BaseIdRequestDto,
  PartialType(CreateNotificationPolicyRequestDto),
) {}

// ==========================================
// ResponseData
// ==========================================

export class NotificationPolicyResponseData extends IntersectionType(BaseIdResponseDto, BaseRegionCodeResponseDto) {
  @ApiProperty({
    description: 'Статус политики',
    enum: NotificationStatus,
    example: NotificationStatus.ACTIVE,
  })
  status!: NotificationStatus;

  @ApiProperty({
    description: 'Информационный канал',
    enum: NotificationType,
    example: NotificationType.MARKETING,
  })
  notificationType!: NotificationType;

  @ApiProperty({
    description: 'Тип канала оповещения',
    enum: ChannelType,
    example: ChannelType.EMAIL,
  })
  channelType!: ChannelType;
}
