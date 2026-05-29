import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length, IsUUID, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { ChannelType, NotificationStatus, NotificationType } from 'src/core/repositories/postgres';
import { enumValues } from 'src/modules/common/utils';

const allowedNotificationTypes = enumValues(NotificationType);
const allowedPersonChannelTypes = enumValues(ChannelType);
const allowedPersonNotificationStatus = enumValues(NotificationStatus);

// Create Request

export class CreateNotificationPolicyRequestDto {
  @ApiProperty({
    description: 'Статус политики',
    enum: NotificationStatus,
    example: NotificationStatus.ACTIVE,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.trim().toLowerCase();
    return value;
  })
  @IsIn(allowedPersonNotificationStatus, {
    message: `Указан неверный статус политики. Допустимые значения: ${allowedPersonNotificationStatus.join(', ')}`,
  })
  status?: NotificationStatus;

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
  notificationType!: NotificationType;

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
  channelType!: ChannelType;

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

// Update Request

export class UpdateNotificationPolicyRequestDto extends PartialType(CreateNotificationPolicyRequestDto) {
  @ApiProperty({
    description: 'ID (UUID)',
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
  })
  @IsUUID('4')
  @IsNotEmpty()
  id!: string;
}

// Response

export class NotificationPolicyResponseData {
  @ApiProperty({
    type: String,
    description: 'ID (UUID)',
    example: '00000000-0000-0000-0000-000000000000',
  })
  id!: string;

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
  @IsNotEmpty()
  channelType!: ChannelType;

  @ApiProperty({
    type: String,
    description: 'Код региона (ISO 2)',
    example: 'RU',
  })
  regionCode!: string;
}
