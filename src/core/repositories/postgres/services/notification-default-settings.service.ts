import { FindOptions, Sequelize } from 'sequelize';
import { Inject, Injectable } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { LoggerMarkers } from 'src/modules/common';
import { ElkLoggerOnMethod, ElkLoggerOnService } from 'src/modules/elk-logger';
import { PrometheusMetricConfigOnService, PrometheusOnMethod } from 'src/modules/prometheus';
import { DATABASE_DI, DB_QUERY_DURATIONS, DB_QUERY_FAILED } from 'src/modules/database';
import { INotificationDefaultSettings, INotificationDefaultSettingsResult, NotificationType } from '../types/types';
import { NotificationDefaultSettingsModel } from '../entities/notification-default-settings.model';
import { QuietRangesHelper } from '../helpers/quiet-ranges.helper';

@PrometheusMetricConfigOnService({
  labels: {
    service: 'NotificationDefaultSettingsService',
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
export class NotificationDefaultSettingsService {
  constructor(
    @Inject(DATABASE_DI)
    private readonly db: Sequelize,
    @Inject(getModelToken(NotificationDefaultSettingsModel))
    private readonly repository: typeof NotificationDefaultSettingsModel,
  ) {}

  @PrometheusOnMethod({
    labels: (params) => {
      return {
        ...params?.labels,
        method: 'findByType',
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
          type: identity,
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
  public async findByType(type: NotificationType): Promise<INotificationDefaultSettings | null> {
    const model = await this.repository.findOne({
      where: {
        type,
      },
    });

    return model ? model.get({ plain: true }) : null;
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
      const data = methodsArgs?.[0];

      return {
        payload: {
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
  public async create(
    data: Partial<INotificationDefaultSettingsResult> &
      Pick<INotificationDefaultSettingsResult, 'type' | 'quietRanges'>,
  ): Promise<INotificationDefaultSettingsResult> {
    return this.db.transaction(async (transaction) => {
      const model = await this.repository.create(
        {
          ...data,
          quietRanges: QuietRangesHelper.convertMinutesToQuietRanges(
            data.quietRanges.quietStart,
            data.quietRanges.quietFinish,
          ),
        } as unknown as INotificationDefaultSettings,
        { transaction },
      );

      return {
        ...model.get({ plain: true }),
        quietRanges: QuietRangesHelper.convertQuietRangesToMinutes(model.quietRanges),
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
    data: Partial<INotificationDefaultSettingsResult> &
      Pick<INotificationDefaultSettingsResult, 'type' | 'quietRanges'>,
  ): Promise<INotificationDefaultSettingsResult> {
    return this.db.transaction(async (transaction) => {
      if (Object.keys(data).length) {
        data.updatedAt = new Date();

        await this.repository.update(
          {
            ...data,
            quietRanges: QuietRangesHelper.convertMinutesToQuietRanges(
              data.quietRanges.quietStart,
              data.quietRanges.quietFinish,
            ),
          },
          {
            transaction,
            where: { id },
          },
        );
      }

      const updatedRecord = await this.repository.findByPk(id, { transaction });
      if (!updatedRecord) {
        throw Error(`Record for ${id} is not exists!`);
      }

      return {
        ...updatedRecord.get({ plain: true }),
        quietRanges: QuietRangesHelper.convertQuietRangesToMinutes(updatedRecord.quietRanges),
      };
    });
  }

  @PrometheusOnMethod({
    labels: (params) => {
      return {
        ...params?.labels,
        method: 'findAll',
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
  public async findAll(
    options?: FindOptions<INotificationDefaultSettings>,
  ): Promise<INotificationDefaultSettingsResult[]> {
    return (await this.repository.findAll(options)).map((opt) => ({
      ...opt.get({ plain: true }),
      quietRanges: QuietRangesHelper.convertQuietRangesToMinutes(opt.quietRanges),
    }));
  }
}
