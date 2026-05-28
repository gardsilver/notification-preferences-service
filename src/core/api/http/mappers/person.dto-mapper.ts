import { Injectable } from '@nestjs/common';
import { DatetimeHelper } from 'src/core/app';
import {
  IPerson,
  IPersonChannel,
  IChannelSettings,
  IPersonChannelWithSettings,
  IQuietRanges,
} from 'src/core/repositories/postgres';
import { CreatePersonRequestDto, UpdatePersonRequestDto, PersonResponseData } from '../dto/person.dto';
import { BaseResponseDto, ResponseStatus } from '../dto/base.dto';

@Injectable()
export class PersonDtoMapper {
  toResponse(
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

  toPerson(dto: CreatePersonRequestDto | UpdatePersonRequestDto): Partial<IPerson> {
    return {
      ...{
        ...dto,
        channels: undefined,
      },
      id: undefined,
    };
  }

  toChannels(
    dto: CreatePersonRequestDto | UpdatePersonRequestDto,
  ): (Partial<Omit<IPersonChannelWithSettings, 'settings'>> & { settings: Partial<IChannelSettings>[] })[] {
    if (!dto.channels?.length) {
      return [];
    }

    return dto.channels.map((channel) => {
      const settings = channel.settings?.length ? channel.settings : [];
      return {
        ...channel,
        settings: settings.map((opt) => ({
          ...opt,
          quietRanges: (opt.quietRanges as IQuietRanges) || { quietStart: 0, quietFinish: 0 },
        })),
      };
    });
  }
}
