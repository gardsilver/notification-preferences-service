import { Injectable } from '@nestjs/common';
import { DateTimestamp } from 'src/modules/date-timestamp';
import { ICheckSendNotification, ICheckSendNotificationStatus } from 'src/core/repositories/postgres';
import {
  PersonalCheckSendNotificationRequestDto,
  PersonalCheckSendNotificationResponseData,
} from '../dto/personal-check-send-notification.dto';
import { BaseResponseDto, ResponseStatus } from '../dto/base.dto';

@Injectable()
export class PersonNotificationDtoMapper {
  toRepositoryInput(dto: PersonalCheckSendNotificationRequestDto): Partial<ICheckSendNotification> {
    return {
      ...dto,
      datetime: new DateTimestamp(dto.datetime),
    };
  }

  toResponse(canSend: ICheckSendNotificationStatus): BaseResponseDto<PersonalCheckSendNotificationResponseData> {
    return {
      status: canSend.status ? ResponseStatus.ALLOW : ResponseStatus.DENY,
      details: canSend.reason,
      data: canSend.channelIds ? { channelIds: canSend.channelIds } : undefined,
    };
  }
}
