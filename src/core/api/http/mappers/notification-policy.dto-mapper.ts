import { Injectable } from '@nestjs/common';
import { INotificationPolicy } from 'src/core/repositories/postgres';
import { BaseResponseDto, ResponseStatus } from '../dto/base.dto';
import {
  CreateNotificationPolicyRequestDto,
  NotificationPolicyResponseData,
  UpdateNotificationPolicyRequestDto,
} from '../dto/notification-policy.dto';

@Injectable()
export class NotificationPolicyMapper {
  toRepositoryInput(
    dto: CreateNotificationPolicyRequestDto | UpdateNotificationPolicyRequestDto,
  ): Partial<Omit<INotificationPolicy, 'id'>> {
    const entity: Partial<Omit<INotificationPolicy, 'id'>> = {
      ...dto,
    };

    return entity;
  }

  toResponse(entity: Required<INotificationPolicy>): BaseResponseDto<NotificationPolicyResponseData> {
    return {
      status: ResponseStatus.SUCCESS,
      data: {
        ...{
          ...entity,
          createdAt: undefined,
          updatedAt: undefined,
        },
      },
    };
  }
}
