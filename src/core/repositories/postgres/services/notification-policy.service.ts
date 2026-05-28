import { Sequelize } from 'sequelize';
import { Inject, Injectable } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { LoggerMarkers } from 'src/modules/common';
import { ElkLoggerOnMethod, ElkLoggerOnService } from 'src/modules/elk-logger';
import { PrometheusMetricConfigOnService, PrometheusOnMethod } from 'src/modules/prometheus';
import { DATABASE_DI, DB_QUERY_DURATIONS, DB_QUERY_FAILED } from 'src/modules/database';
import { INotificationPolicy } from '../types/types';
import { NotificationPolicyModel } from '../entities/notification-policy.model';

@PrometheusMetricConfigOnService({
  labels: {
    service: 'NotificationPolicyService',
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
export class NotificationPolicyService {
  constructor(
    @Inject(DATABASE_DI)
    private readonly db: Sequelize,
    @Inject(getModelToken(NotificationPolicyModel))
    private readonly repository: typeof NotificationPolicyModel,
  ) {}

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
    data: Partial<INotificationPolicy> & Pick<INotificationPolicy, 'notificationType' | 'channelType' | 'regionCode'>,
  ): Promise<INotificationPolicy> {
    return this.db.transaction(async (transaction) => {
      const model = await this.repository.create(
        {
          ...data,
        } as unknown as INotificationPolicy,
        { transaction },
      );

      return model.get({ plain: true });
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
  public async update(id: string, data: Partial<Omit<INotificationPolicy, 'id'>>): Promise<INotificationPolicy> {
    return this.db.transaction(async (transaction) => {
      if (Object.keys(data).length) {
        data.updatedAt = new Date();

        await this.repository.update(
          {
            ...data,
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

      return updatedRecord.get({ plain: true });
    });
  }
}
