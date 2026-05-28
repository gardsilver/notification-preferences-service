import { Injectable } from '@nestjs/common';
import {
  INotificationDefaultSettingsResult,
  NotificationDefaultSettingsService as RepositoryService,
} from 'src/core/repositories/postgres';
import { BaseResponseDto } from '../dto/base.dto';
import {
  CreateNotificationDefaultSettingsRequestDto,
  NotificationDefaultSettingsResponseData,
  UpdateNotificationDefaultSettingsRequestDto,
} from '../dto/notification-default-settings.dto';
import { ErrorHandler } from '../handlers/error.handler';
import { NotificationDefaultSettingsDtoMapper } from '../mappers/notification-default-settings.dto-mapper';

@Injectable()
export class NotificationDefaultSettingsService {
  constructor(
    private readonly repositoryService: RepositoryService,
    private readonly mapper: NotificationDefaultSettingsDtoMapper,
    private readonly errorHandler: ErrorHandler,
  ) {}

  async create(
    dto: CreateNotificationDefaultSettingsRequestDto,
  ): Promise<BaseResponseDto<NotificationDefaultSettingsResponseData>> {
    try {
      const repositoryInput = this.mapper.toRepositoryInput(dto) as unknown as INotificationDefaultSettingsResult;

      const settings = await this.repositoryService.create(repositoryInput);

      return this.mapper.toResponse(settings);
    } catch (error: unknown) {
      this.errorHandler.handle(error, 'NotificationDefaultSettings');
    }
  }

  async update(
    dto: UpdateNotificationDefaultSettingsRequestDto,
  ): Promise<BaseResponseDto<NotificationDefaultSettingsResponseData>> {
    try {
      const repositoryInput = this.mapper.toRepositoryInput(dto) as unknown as INotificationDefaultSettingsResult;

      const settings = await this.repositoryService.update(dto.id, repositoryInput);

      return this.mapper.toResponse(settings);
    } catch (error: unknown) {
      this.errorHandler.handle(error, 'NotificationDefaultSettings');
    }
  }
}
