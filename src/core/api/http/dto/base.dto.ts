import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export enum ResponseStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  ALLOW = 'allow',
  DENY = 'deny',
}

export class BaseResponseDto<T = unknown> {
  @ApiProperty({ description: 'Статус ответа', enum: ResponseStatus, example: ResponseStatus.SUCCESS })
  status!: ResponseStatus;

  @ApiProperty({ description: 'Детали ошибки (если есть)', example: 'Детали не указаны' })
  @IsOptional()
  @IsString()
  details?: string;

  data?: T;
}
