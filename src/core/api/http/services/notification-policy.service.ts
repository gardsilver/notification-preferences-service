import { Injectable } from '@nestjs/common';
import { INotificationPolicy, NotificationPolicyService as RepositoryService } from 'src/core/repositories/postgres';
import { BaseResponseDto } from '../dto/base.dto';
import { ErrorHandler } from '../handlers/error.handler';
import { NotificationPolicyMapper } from '../mappers/notification-policy.dto-mapper';
import {
  CreateNotificationPolicyRequestDto,
  NotificationPolicyResponseData,
  UpdateNotificationPolicyRequestDto,
} from '../dto/notification-policy.dto';

@Injectable()
export class NotificationPolicyService {
  constructor(
    private readonly repositoryService: RepositoryService,
    private readonly mapper: NotificationPolicyMapper,
    private readonly errorHandler: ErrorHandler,
  ) {}

  async create(dto: CreateNotificationPolicyRequestDto): Promise<BaseResponseDto<NotificationPolicyResponseData>> {
    try {
      const repositoryInput = this.mapper.toRepositoryInput(dto) as unknown as INotificationPolicy;

      const settings = await this.repositoryService.create(repositoryInput);

      return this.mapper.toResponse(settings as unknown as Required<INotificationPolicy>);
    } catch (error: unknown) {
      this.errorHandler.handle(error, 'NotificationPolicy');
    }
  }

  async update(dto: UpdateNotificationPolicyRequestDto): Promise<BaseResponseDto<NotificationPolicyResponseData>> {
    try {
      const repositoryInput = this.mapper.toRepositoryInput(dto) as unknown as INotificationPolicy;

      const settings = await this.repositoryService.update(dto.id, repositoryInput);

      return this.mapper.toResponse(settings as unknown as Required<INotificationPolicy>);
    } catch (error: unknown) {
      this.errorHandler.handle(error, 'NotificationPolicy');
    }
  }
}
