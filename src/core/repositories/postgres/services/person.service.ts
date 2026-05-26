import { Sequelize } from 'sequelize-typescript';
import { Inject, Injectable } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { LoggerMarkers } from 'src/modules/common';
import { ElkLoggerOnMethod, ElkLoggerOnService } from 'src/modules/elk-logger';
import { PrometheusMetricConfigOnService, PrometheusOnMethod } from 'src/modules/prometheus';
import { DATABASE_DI, DB_QUERY_DURATIONS, DB_QUERY_FAILED } from 'src/modules/database';
import { ChannelType, IPerson, IPersonChannel, IPersonChannelWithSettings, IPersonWithChannels } from '../types/types';
import { PersonModel } from '../entities/person.model';
import { PersonChannelService } from './person-channel.service';
import { QuietRangesHelper } from '../helpers/quiet-ranges.helper';

@PrometheusMetricConfigOnService({
  labels: {
    service: 'PersonService',
  },
  counter: DB_QUERY_FAILED,
  histogram: DB_QUERY_DURATIONS,
})
@ElkLoggerOnService({
  fields: () => {
    return {
      markers: [LoggerMarkers.DB],
    };
  },
})
@Injectable()
export class PersonService {
  constructor(
    @Inject(DATABASE_DI)
    private readonly db: Sequelize,
    @Inject(getModelToken(PersonModel))
    private readonly repository: typeof PersonModel,
    private readonly channelService: PersonChannelService,
  ) {}

  @PrometheusOnMethod({
    labels: (params) => {
      return {
        ...params?.labels,
        method: 'findById',
      };
    },
    before: {
      histogram: {
        startTimer: true,
      },
    },
    throw: {
      counter: {
        increment: true,
      },
    },
  })
  @ElkLoggerOnMethod({
    fields: ({ methodsArgs }) => {
      const identity = methodsArgs?.[0];

      return {
        payload: {
          id: identity,
        },
      };
    },
    before: false,
    after: false,
    throw: ({ error }) => {
      return {
        message: 'DB request failed',
        data: {
          markers: [LoggerMarkers.REQUEST, LoggerMarkers.FAILED],
          payload: {
            error,
          },
        },
      };
    },
  })
  public async findById(id: string): Promise<IPerson | null> {
    const model = await this.repository.findOne({
      where: {
        id,
      },
    });

    return model ? model.get({ plain: true }) : null;
  }

  @PrometheusOnMethod({
    labels: (params) => {
      return {
        ...params?.labels,
        method: 'isChannelExist',
      };
    },
    before: {
      histogram: {
        startTimer: true,
      },
    },
    throw: {
      counter: {
        increment: true,
      },
    },
  })
  @ElkLoggerOnMethod({
    fields: ({ methodsArgs }) => {
      const type = methodsArgs?.[0];
      const value = methodsArgs?.[0];
      const excludeId = methodsArgs?.[0];

      return {
        payload: {
          type,
          value,
          excludeId,
        },
      };
    },
    before: false,
    after: false,
    throw: ({ error }) => {
      return {
        message: 'DB request failed',
        data: {
          markers: [LoggerMarkers.REQUEST, LoggerMarkers.FAILED],
          payload: {
            error,
          },
        },
      };
    },
  })
  public async isChannelExist(type: ChannelType, value: string, excludeId?: string): Promise<boolean> {
    return this.channelService.isExist(type, value, excludeId);
  }

  @PrometheusOnMethod({
    labels: (params) => {
      return {
        ...params?.labels,
        method: 'info',
      };
    },
    before: {
      histogram: {
        startTimer: true,
      },
    },
    throw: {
      counter: {
        increment: true,
      },
    },
  })
  @ElkLoggerOnMethod({
    fields: ({ methodsArgs }) => {
      const identity = methodsArgs?.[0];
      const data = methodsArgs?.[1];

      return {
        payload: {
          request: methodsArgs,
          id: identity,
          data,
        },
      };
    },
    before: false,
    after: false,
    throw: ({ error }) => {
      return {
        message: 'DB request failed',
        data: {
          markers: [LoggerMarkers.REQUEST, LoggerMarkers.FAILED],
          payload: {
            error,
          },
        },
      };
    },
  })
  public async info(id: string): Promise<IPersonWithChannels> {
    const person = await this.repository.findByPk(id, {
      include: [
        {
          association: 'channels',
          include: [
            {
              association: 'settings',
              attributes: ['status', 'type', 'quietRanges'],
            },
          ],
        },
      ],
    });

    if (!person) {
      throw new Error(`Record for ${id} is not exists!`);
    }

    return {
      ...person.get({ plain: true }),
      channels: (person.channels || []).map((channel) => ({
        ...channel.get({ plain: true }),
        settings: (channel.settings || []).map((opt) => ({
          ...opt.get({ plain: true }),
          quietRanges: QuietRangesHelper.convertQuietRangesToMinutes(opt.quietRanges),
        })),
      })),
    };
  }

  @PrometheusOnMethod({
    labels: (params) => {
      return {
        ...params?.labels,
        method: 'create',
      };
    },
    before: {
      histogram: {
        startTimer: true,
      },
    },
    throw: {
      counter: {
        increment: true,
      },
    },
  })
  @ElkLoggerOnMethod({
    fields: ({ methodsArgs }) => {
      const personData = methodsArgs?.[0];
      const channelsData = methodsArgs?.[1];

      return {
        payload: {
          personData,
          channelsData,
        },
      };
    },
    before: false,
    after: false,
    throw: ({ error }) => {
      return {
        message: 'DB request failed',
        data: {
          markers: [LoggerMarkers.REQUEST, LoggerMarkers.FAILED],
          payload: {
            error,
          },
        },
      };
    },
  })
  public async create(
    personData: Pick<IPerson, 'regionCode' | 'timezone' | 'birthday' | 'lastName' | 'firstName'> &
      Partial<Pick<IPerson, 'middleName'>>,
    channelsData?: (Partial<IPersonChannel> &
      Pick<IPersonChannelWithSettings, 'status' | 'isVerified' | 'type' | 'value' | 'settings'>)[],
  ): Promise<IPersonWithChannels> {
    return this.db.transaction(async (transaction) => {
      const savedPerson = await this.repository.create(personData as unknown as IPerson, { transaction });
      const channels = await this.channelService.saveList(savedPerson, channelsData, { transaction });

      return {
        ...savedPerson.get({ plain: true }),
        channels,
      };
    });
  }

  @PrometheusOnMethod({
    labels: (params) => {
      return {
        ...params?.labels,
        method: 'update',
      };
    },
    before: {
      histogram: {
        startTimer: true,
      },
    },
    throw: {
      counter: {
        increment: true,
      },
    },
  })
  @ElkLoggerOnMethod({
    fields: ({ methodsArgs }) => {
      const identity = methodsArgs?.[0];
      const data = methodsArgs?.[1];

      return {
        payload: {
          request: methodsArgs,
          id: identity,
          data,
        },
      };
    },
    before: false,
    after: false,
    throw: ({ error }) => {
      return {
        message: 'DB request failed',
        data: {
          markers: [LoggerMarkers.REQUEST, LoggerMarkers.FAILED],
          payload: {
            error,
          },
        },
      };
    },
  })
  public async update(
    id: string,
    personData: Partial<Omit<Pick<IPerson, 'regionCode' | 'timezone' | 'birthday' | 'lastName' | 'firstName'>, 'id'>>,
    channelsData?: (Partial<IPersonChannel> &
      Pick<IPersonChannelWithSettings, 'status' | 'isVerified' | 'type' | 'value' | 'settings'>)[],
  ): Promise<IPersonWithChannels> {
    return this.db.transaction(async (transaction) => {
      if (Object.keys(personData).length) {
        await this.repository.update(
          {
            ...personData,
            updatedAt: new Date(),
          },
          {
            transaction,
            where: { id },
          },
        );
      }

      const savedPerson = await this.repository.findByPk(id, { transaction });
      if (!savedPerson) {
        throw Error(`Record for ${id} is not exists!`);
      }

      const channels = await this.channelService.saveList(savedPerson, channelsData, { transaction });

      return {
        ...savedPerson.get({ plain: true }),
        channels,
      };
    });
  }
}
