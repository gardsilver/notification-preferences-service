import { Transform } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BaseNotificationFieldsRequestDto } from './base.dto';

// ==========================================
// RequestDto
// ==========================================

export class PersonalCheckSendNotificationRequestDto extends BaseNotificationFieldsRequestDto {
  @ApiProperty({
    type: String,
    description: 'ID пользователя (UUID)',
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID('4')
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  personId!: string;

  @ApiProperty({
    type: String,
    description: 'UTC datetime',
    example: '2026-05-21T21:30:00Z',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @IsDateString({}, { message: 'datetime должен быть валидной UTC ISO датой' })
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? trimmed : date.toISOString();
  })
  datetime!: string;
}

// ==========================================
// ResponseData
// ==========================================

export class PersonalCheckSendNotificationResponseData {
  @ApiProperty({
    type: [String],
    description: 'Список доступных каналов оповещения пользователя',
    example: ['00000000-0000-0000-0000-000000000001'],
  })
  channelIds?: string[];
}
