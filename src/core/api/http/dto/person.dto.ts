import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsISO8601, Length, IsUUID, ValidateNested, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  CreatePersonChannelRequestDto,
  PersonChannelResponseData,
  UpdatePersonChannelRequestData,
} from './person-channel.dto';

// Create Request

export class CreatePersonRequestDto {
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

  @ApiProperty({ type: String, description: 'Отчество (при наличии)', example: 'Иванович' })
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

// Update Request

export class UpdatePersonRequestDto {
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

  @ApiProperty({ type: String, description: 'Имя', example: 'Иван', default: 'Иван' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  firstName?: string;

  @ApiProperty({ type: String, description: 'Фамилия', example: 'Иванов', default: 'Иванов' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lastName?: string;

  @ApiProperty({ type: String, description: 'Отчество (при наличии)', example: 'Иванович' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  middleName?: string;

  @ApiProperty({
    type: String,
    description: 'Дата рождения (YYYY-MM-DD)',
    example: '1990-01-15',
    default: '1990-01-15',
  })
  @IsISO8601()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  birthday?: string;

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
    description: 'Временная зона пользователя',
    example: 'Europe/Moscow',
    default: 'Europe/Moscow',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  timezone?: string;

  @ApiProperty({
    type: [UpdatePersonChannelRequestData],
    description: 'Список каналов оповещения пользователя',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePersonChannelRequestData)
  channels?: UpdatePersonChannelRequestData[];
}

// Response

export class PersonResponseData {
  @ApiProperty({
    type: String,
    description: 'ID (UUID)',
    example: '00000000-0000-0000-0000-000000000000',
  })
  id?: string;

  @ApiProperty({ type: String, description: 'Имя', example: 'Иван' })
  firstName!: string;

  @ApiProperty({ type: String, description: 'Фамилия', example: 'Иванов' })
  lastName!: string;

  @ApiProperty({ type: String, description: 'Отчество (при наличии)', example: 'Иванович' })
  middleName?: string;

  @ApiProperty({
    type: String,
    description: 'Дата рождения (YYYY-MM-DD)',
  })
  birthday!: string;

  @ApiProperty({ type: String, description: 'Код региона (ISO 2)', example: 'RU' })
  regionCode!: string;

  @ApiProperty({
    type: String,
    description: 'Временная зона пользователя',
  })
  timezone!: string;

  @ApiProperty({
    type: [PersonChannelResponseData],
    description: 'Список каналов оповещения пользователя',
  })
  channels!: PersonChannelResponseData[];
}
