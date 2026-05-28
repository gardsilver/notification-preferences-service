import { Injectable } from '@nestjs/common';
import { ICheckSendNotification, PersonNotificationService as RepositoryService } from 'src/core/repositories/postgres';
import {
  PersonalCheckSendNotificationRequestDto,
  PersonalCheckSendNotificationResponseData,
} from '../dto/personal-check-send-notification.dto';
import { BaseResponseDto } from '../dto/base.dto';
import { PersonNotificationDtoMapper } from '../mappers/person-notification.dto-mapper';
import { ErrorHandler } from '../handlers/error.handler';

@Injectable()
export class PersonNotificationService {
  constructor(
    private readonly repositoryService: RepositoryService,
    private readonly mapper: PersonNotificationDtoMapper,
    private readonly errorHandler: ErrorHandler,
  ) {}

  async checkSend(
    dto: PersonalCheckSendNotificationRequestDto,
  ): Promise<BaseResponseDto<PersonalCheckSendNotificationResponseData>> {
    try {
      const repositoryInput = this.mapper.toRepositoryInput(dto) as unknown as ICheckSendNotification;

      const canSend = await this.repositoryService.checkSend(repositoryInput);

      return this.mapper.toResponse(canSend);
    } catch (error) {
      this.errorHandler.handle(error, 'Person');
    }
  }
}
