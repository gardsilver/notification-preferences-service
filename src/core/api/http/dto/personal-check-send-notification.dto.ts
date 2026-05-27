import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { enumValues } from 'src/modules/common/utils';
import { ChannelType, NotificationType } from 'src/core/repositories/postgres';

const allowedPersonNotificationTypes = enumValues(NotificationType);
const allowedPersonChannelTypes = enumValues(ChannelType);

// Create Request

export class PersonalCheckSendNotificationRequestDto {
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
  personId!: string;

  @ApiProperty({
    description: 'Типы уведомлений',
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
  })
  @IsString()
  @Length(2, 2)
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  regionCode?: string;

  @ApiProperty({
    type: String,
    description: 'UTC datetime',
    example: '2026-05-21T21:30:00Z',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @IsDateString(
    {},
    {
      message: 'datetime должен быть валидной UTC ISO датой',
    },
  )
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;

    const trimmed = value.trim();

    // приводим к UTC ISO
    const date = new Date(trimmed);

    return Number.isNaN(date.getTime()) ? trimmed : date.toISOString();
  })
  datetime!: string;
}

// Create Response

export class PersonalCheckSendNotificationResponseData {
  @ApiProperty({
    type: [String],
    description: 'Список доступных каналов оповещения пользователя',
  })
  channelIds?: string[];
}
