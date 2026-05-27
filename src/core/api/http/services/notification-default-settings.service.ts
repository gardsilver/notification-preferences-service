import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  INotificationDefaultSettingsResult,
  NotificationDefaultSettingsService as RepositoryService,
} from 'src/core/repositories/postgres';
import { DatetimeHelper } from 'src/core/app';
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
      const settings = await this.repositoryService.create(
        this.mapDto(dto) as unknown as INotificationDefaultSettingsResult,
      );

      return this.mapResponse(settings);
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
      const settings = await this.repositoryService.update(
        dto.id,
        this.mapDto(dto) as unknown as INotificationDefaultSettingsResult,
      );

      return this.mapResponse(settings);
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
  ): Partial<INotificationDefaultSettingsResult> {
    const settings: Partial<INotificationDefaultSettingsResult> = {
      type: dto.type,
    };

    if (dto.quietStart !== undefined && dto.quietFinish !== undefined) {
      settings.quietRanges = {
        quietStart: dto.quietStart,
        quietFinish: dto.quietFinish,
      };
    }

    return settings;
  }

  private mapResponse(
    settings: INotificationDefaultSettingsResult,
  ): BaseResponseDto<NotificationDefaultSettingsResponseData> {
    return {
      status: ResponseStatus.SUCCESS,
      data: {
        ...{ ...settings, quietRanges: undefined },
        id: settings.id ? settings.id : '',
        quietStart: DatetimeHelper.minutesToTime(settings.quietRanges.quietStart) || '00',
        quietFinish: DatetimeHelper.minutesToTime(settings.quietRanges.quietFinish) || '00',
      },
    };
  }
}
