import { Injectable } from '@nestjs/common';
import {
  PersonService as RepositoryService,
  IPerson,
  IPersonChannelWithSettings,
} from 'src/core/repositories/postgres';
import { PersonResponseData, CreatePersonRequestDto, UpdatePersonRequestDto } from '../dto/person.dto';
import { BaseResponseDto, ResponseStatus } from '../dto/base.dto';
import { PersonDtoMapper } from '../mappers/person.dto-mapper';
import { ErrorHandler } from '../handlers/error.handler';

@Injectable()
export class PersonService {
  constructor(
    private readonly repositoryService: RepositoryService,
    private readonly mapper: PersonDtoMapper,
    private readonly errorHandler: ErrorHandler,
  ) {}

  async info(id: string): Promise<BaseResponseDto<PersonResponseData>> {
    try {
      const personData = await this.repositoryService.info(id);

      return this.mapper.toResponse(personData);
    } catch (error: unknown) {
      this.errorHandler.handle(error, 'Person');
    }
  }

  async create(dto: CreatePersonRequestDto): Promise<BaseResponseDto<PersonResponseData>> {
    try {
      const personCreateData = this.mapper.toPerson(dto) as unknown as IPerson;
      const channelsCreateData = this.mapper.toChannels(dto) as unknown as IPersonChannelWithSettings[];

      const personData = await this.repositoryService.create(personCreateData, channelsCreateData);
      return this.mapper.toResponse(personData);
    } catch (error) {
      this.errorHandler.handle(error, 'Person');
    }
  }

  async update(dto: UpdatePersonRequestDto): Promise<BaseResponseDto<PersonResponseData>> {
    try {
      const personUpdateData = this.mapper.toPerson(dto) as unknown as IPerson;
      const channelsUpdateData = this.mapper.toChannels(dto) as unknown as IPersonChannelWithSettings[];

      const personData = await this.repositoryService.update(dto.id, personUpdateData, channelsUpdateData);

      return {
        status: ResponseStatus.SUCCESS,
        data: personData as unknown as PersonResponseData,
      };
    } catch (error) {
      this.errorHandler.handle(error, 'Person');
    }
  }
}
