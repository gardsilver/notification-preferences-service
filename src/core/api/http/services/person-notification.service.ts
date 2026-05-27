import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DateTimestamp } from 'src/modules/date-timestamp';
import {
  ICheckSendNotification,
  ICheckSendNotificationStatus,
  PersonNotificationService as RepositoryService,
} from 'src/core/repositories/postgres';
import {
  PersonalCheckSendNotificationRequestDto,
  PersonalCheckSendNotificationResponseData,
} from '../dto/personal-check-send-notification.dto';
import { BaseResponseDto, ResponseStatus } from '../dto/base.dto';

@Injectable()
export class PersonNotificationService {
  constructor(private readonly repositoryService: RepositoryService) {}

  async checkSend(
    dto: PersonalCheckSendNotificationRequestDto,
  ): Promise<BaseResponseDto<PersonalCheckSendNotificationResponseData>> {
    try {
      const canSend = await this.repositoryService.checkSend(
        this.mapRequestDto(dto) as unknown as ICheckSendNotification,
      );

      return this.mapResponse(canSend);
    } catch {
      // Общая обработка непредвиденных ошибок слоя БД
      throw new InternalServerErrorException({
        status: ResponseStatus.ERROR,
        details: 'Internal database error.',
      });
    }
  }

  private mapRequestDto(dto: PersonalCheckSendNotificationRequestDto): Partial<ICheckSendNotification> {
    return {
      ...dto,
      datetime: new DateTimestamp(dto.datetime),
    };
  }

  private mapResponse(
    canSend: ICheckSendNotificationStatus,
  ): BaseResponseDto<PersonalCheckSendNotificationResponseData> {
    return {
      status: canSend.status ? ResponseStatus.ALLOW : ResponseStatus.DENY,
      details: canSend.reason,
      data: canSend.channelIds ? { channelIds: canSend.channelIds } : undefined,
    };
  }
}
