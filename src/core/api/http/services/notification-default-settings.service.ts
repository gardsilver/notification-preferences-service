import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  INotificationDefaultSettings,
  QuietRangesHelper,
  NotificationDefaultSettingsService as RepositoryService,
} from 'src/core/repositories/postgres';
import { BaseResponseDto, ResponseStatus } from '../dto/base.dto';
import {
  CreateNotificationDefaultSettingsRequestDto,
  NotificationDefaultSettingsResponseData,
  UpdateNotificationDefaultSettingsRequestDto,
} from '../dto/notification-default-settings.dto';

@Injectable()
export class NotificationDefaultSettingsService {
  constructor(private readonly repositoryService: RepositoryService) {}

  async create(
    dto: CreateNotificationDefaultSettingsRequestDto,
  ): Promise<BaseResponseDto<NotificationDefaultSettingsResponseData>> {
    try {
      const savedPerson = await this.repositoryService.create(
        this.mapDto(dto) as unknown as INotificationDefaultSettings,
      );

      return {
        status: ResponseStatus.SUCCESS,
        data: { id: savedPerson.id! },
      };
    } catch (error: unknown) {
      if (
        typeof error == 'object' &&
        error != null &&
        'name' in error &&
        error.name === 'SequelizeUniqueConstraintError'
      ) {
        throw new BadRequestException({
          status: ResponseStatus.ERROR,
          details: 'NotificationDefaultSettings with these unique fields already exists.',
        });
      }

      // Общая обработка непредвиденных ошибок слоя БД
      throw new InternalServerErrorException({
        status: ResponseStatus.ERROR,
        details: 'Internal database error occurred while creating NotificationDefaultSettings.',
      });
    }
  }

  async update(
    dto: UpdateNotificationDefaultSettingsRequestDto,
  ): Promise<BaseResponseDto<NotificationDefaultSettingsResponseData>> {
    try {
      const savedPerson = await this.repositoryService.update(
        dto.id,
        this.mapDto(dto) as unknown as INotificationDefaultSettings,
      );

      return {
        status: ResponseStatus.SUCCESS,
        data: { id: savedPerson.id! },
      };
    } catch (error: unknown) {
      if (
        typeof error == 'object' &&
        error != null &&
        'name' in error &&
        error.name === 'SequelizeUniqueConstraintError'
      ) {
        throw new BadRequestException({
          status: ResponseStatus.ERROR,
          details: 'Person with these unique fields already exists.',
        });
      }

      // Общая обработка непредвиденных ошибок слоя БД
      throw new InternalServerErrorException({
        status: ResponseStatus.ERROR,
        details: 'Internal database error occurred while creating NotificationDefaultSettings.',
      });
    }
  }

  private mapDto(
    dto: CreateNotificationDefaultSettingsRequestDto | UpdateNotificationDefaultSettingsRequestDto,
  ): Partial<INotificationDefaultSettings> {
    const settings: Partial<INotificationDefaultSettings> = {
      type: dto.type,
    };

    if (dto.quietStart !== undefined && dto.quietFinish !== undefined) {
      settings.quietRanges = QuietRangesHelper.convertMinutesToQuietRanges(dto.quietStart, dto.quietFinish);
    }

    return settings;
  }
}
