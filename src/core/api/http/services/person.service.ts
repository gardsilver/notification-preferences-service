import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import {
  PersonService as RepositoryService,
  IPerson,
  IPersonChannel,
  IChannelSettings,
  IPersonChannelWithSettings,
  IQuietRanges,
} from 'src/core/repositories/postgres';
import { PersonResponseData, CreatePersonRequestDto, UpdatePersonRequestDto } from '../dto/person.dto';
import { BaseResponseDto, ResponseStatus } from '../dto/base.dto';
import { DatetimeHelper } from '../helpers/datetime.helper';

@Injectable()
export class PersonService {
  constructor(private readonly repositoryService: RepositoryService) {}

  async info(id: string): Promise<BaseResponseDto<PersonResponseData>> {
    try {
      const personData = await this.repositoryService.info(id);

      return this.mapResponse(personData);
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
        details: 'Internal database error occurred while creating Person.',
      });
    }
  }

  async create(dto: CreatePersonRequestDto): Promise<BaseResponseDto<PersonResponseData>> {
    try {
      const personData = await this.repositoryService.create(
        this.mapPersonDto(dto) as unknown as IPerson,
        this.mapPersonChannelDto(dto) as unknown as IPersonChannelWithSettings[],
      );

      return this.mapResponse(personData);
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
        details: 'Internal database error occurred while creating Person.',
      });
    }
  }

  async update(dto: UpdatePersonRequestDto): Promise<BaseResponseDto<PersonResponseData>> {
    try {
      const personData = await this.repositoryService.update(
        dto.id,
        this.mapPersonDto(dto) as unknown as IPerson,
        this.mapPersonChannelDto(dto) as unknown as IPersonChannelWithSettings[],
      );

      return {
        status: ResponseStatus.SUCCESS,
        data: personData as unknown as PersonResponseData,
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
        details: 'Internal database error occurred while creating Person.',
      });
    }
  }

  private mapResponse(
    personData: IPerson & { channels: (IPersonChannel & { settings?: IChannelSettings[] })[] },
  ): BaseResponseDto<PersonResponseData> {
    return {
      status: ResponseStatus.SUCCESS,
      data: {
        ...personData,
        id: personData.id !== null ? personData.id : undefined,
        middleName: personData.middleName !== null ? personData.middleName : undefined,
        channels: personData.channels?.map((channel) => ({
          ...channel,
          label: channel.label !== null ? channel.label : undefined,
          settings:
            channel.settings?.map((opt) => ({
              ...opt,
              quietRanges: {
                quietStart: DatetimeHelper.minutesToTime(opt.quietRanges.quietStart) || '00',
                quietFinish: DatetimeHelper.minutesToTime(opt.quietRanges.quietFinish) || '00',
              },
            })) || [],
        })),
      },
    };
  }

  private mapPersonDto(dto: CreatePersonRequestDto | UpdatePersonRequestDto): Partial<IPerson> {
    return {
      ...{
        ...dto,
        channels: undefined,
        id: undefined,
      },
    };
  }

  private mapPersonChannelDto(
    dto: CreatePersonRequestDto | UpdatePersonRequestDto,
  ): (Partial<Omit<IPersonChannelWithSettings, 'settings'>> & { settings: Partial<IChannelSettings>[] })[] {
    if (!dto.channels?.length) {
      return [];
    }

    return dto.channels.map((channel) => {
      const settings = channel.settings?.length ? channel.settings : [];

      return {
        ...channel,
        settings: settings.map((opt) => {
          const quietRanges: IQuietRanges = opt.quietRanges
            ? (opt.quietRanges as IQuietRanges)
            : { quietStart: 0, quietFinish: 0 };
          return {
            ...opt,
            quietRanges,
          };
        }),
      };
    });
  }
}
