import { Injectable } from '@nestjs/common';
import { DatetimeHelper } from 'src/core/app';
import { INotificationDefaultSettingsResult } from 'src/core/repositories/postgres';
import { BaseResponseDto, ResponseStatus } from '../dto/base.dto';
import {
  CreateNotificationDefaultSettingsRequestDto,
  NotificationDefaultSettingsResponseData,
  UpdateNotificationDefaultSettingsRequestDto,
} from '../dto/notification-default-settings.dto';

@Injectable()
export class NotificationDefaultSettingsDtoMapper {
  toRepositoryInput(
    dto: CreateNotificationDefaultSettingsRequestDto | UpdateNotificationDefaultSettingsRequestDto,
  ): Partial<INotificationDefaultSettingsResult> {
    const settings: Partial<INotificationDefaultSettingsResult> = {
      type: dto.type,
    };

    if (dto.quietRanges !== undefined) {
      settings.quietRanges = dto.quietRanges;
    }

    return settings;
  }

  toResponse(settings: INotificationDefaultSettingsResult): BaseResponseDto<NotificationDefaultSettingsResponseData> {
    return {
      status: ResponseStatus.SUCCESS,
      data: {
        ...{ ...settings, quietRanges: undefined },
        id: settings.id ? settings.id : '',
        quietRanges: {
          quietStart: DatetimeHelper.minutesToTime(settings.quietRanges.quietStart) || '00',
          quietFinish: DatetimeHelper.minutesToTime(settings.quietRanges.quietFinish) || '00',
        },
      },
    };
  }
}
