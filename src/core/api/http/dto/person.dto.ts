import { ApiProperty, IntersectionType, PartialType, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsISO8601, ValidateNested, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  CreatePersonChannelRequestDto,
  PersonChannelResponseData,
  UpdatePersonChannelRequestData,
} from './person-channel.dto';
import { BaseIdRequestDto, BaseIdResponseDto, BaseRegionCodeRequestDto, BaseRegionCodeResponseDto } from './base.dto';

// ==========================================
// Create RequestDto
// ==========================================

export class CreatePersonRequestDto extends BaseRegionCodeRequestDto {
  @ApiProperty({ type: String, description: 'Имя', example: 'Иван', default: 'Иван', required: true })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  firstName!: string;

  @ApiProperty({ type: String, description: 'Фамилия', example: 'Иванов', default: 'Иванов', required: true })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lastName!: string;

  @ApiProperty({ type: String, description: 'Отчество (при наличии)', example: 'Иванович', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  middleName?: string;

  @ApiProperty({
    type: String,
    description: 'Дата рождения (YYYY-MM-DD)',
    example: '1990-01-15',
    default: '1990-01-15',
    required: true,
  })
  @IsISO8601()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  birthday!: string;

  @ApiProperty({
    type: String,
    description: 'Временная зона пользователя',
    example: 'Europe/Moscow',
    default: 'Europe/Moscow',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  timezone!: string;

  @ApiProperty({
    type: [CreatePersonChannelRequestDto],
    description: 'Список каналов оповещения пользователя',
  })
  @IsArray({ message: 'Поле channels должно быть массивом' })
  @ValidateNested({ each: true })
  @Type(() => CreatePersonChannelRequestDto)
  channels!: CreatePersonChannelRequestDto[];
}

// ==========================================
// Update RequestDto
// ==========================================

export class UpdatePersonRequestDto extends IntersectionType(
  BaseIdRequestDto,
  PartialType(OmitType(CreatePersonRequestDto, ['channels'] as const)),
) {
  @ApiProperty({
    type: [UpdatePersonChannelRequestData],
    description: 'Список каналов оповещения пользователя',
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Поле channels должно быть массивом' })
  @ValidateNested({ each: true })
  @Type(() => UpdatePersonChannelRequestData)
  channels?: UpdatePersonChannelRequestData[];
}

// ==========================================
// ResponseData
// ==========================================

export class PersonResponseData extends IntersectionType(BaseIdResponseDto, BaseRegionCodeResponseDto) {
  @ApiProperty({ type: String, description: 'Имя', example: 'Иван' })
  firstName!: string;

  @ApiProperty({ type: String, description: 'Фамилия', example: 'Иванов' })
  lastName!: string;

  @ApiProperty({ type: String, description: 'Отчество (при наличии)', example: 'Иванович' })
  middleName?: string;

  @ApiProperty({
    type: String,
    description: 'Дата рождения (YYYY-MM-DD)',
    example: '1990-01-15',
  })
  birthday!: string;

  @ApiProperty({
    type: String,
    description: 'Временная зона пользователя',
    example: 'Europe/Moscow',
  })
  timezone!: string;

  @ApiProperty({
    type: [PersonChannelResponseData],
    description: 'Список каналов оповещения пользователя',
  })
  channels!: PersonChannelResponseData[];
}
