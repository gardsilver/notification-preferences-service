import { Sequelize } from 'sequelize-typescript';
import { Inject, Injectable } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { LoggerMarkers } from 'src/modules/common';
import { ElkLoggerOnMethod, ElkLoggerOnService } from 'src/modules/elk-logger';
import { PrometheusMetricConfigOnService, PrometheusOnMethod } from 'src/modules/prometheus';
import { DATABASE_DI, DB_QUERY_DURATIONS, DB_QUERY_FAILED } from 'src/modules/database';
import { ApiIdempotencyModel } from '../entities/api-idempotency.model';
import { IApiIdempotency } from '../types/types';

@PrometheusMetricConfigOnService({
  labels: {
    service: 'ApiIdempotencyService',
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
export class ApiIdempotencyService {
  constructor(
    @Inject(DATABASE_DI)
    private readonly db: Sequelize,
    @Inject(getModelToken(ApiIdempotencyModel))
    private readonly repository: typeof ApiIdempotencyModel,
  ) {}

  @PrometheusOnMethod({
    labels: (params) => {
      return {
        ...params?.labels,
        method: 'findByPk',
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
      const identityKey = methodsArgs?.[0];

      return {
        payload: {
          id: identityKey,
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
  public async findByPk(idempotencyKey: string): Promise<IApiIdempotency | null> {
    const model = await this.db.transaction(async (t) => {
      return this.repository.findByPk(idempotencyKey, {
        lock: t.LOCK.UPDATE, // Генерирует SELECT ... FROM api_idempotency WHERE id = ? FOR UPDATE
        transaction: t,
      });
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
  public async create(data: Omit<IApiIdempotency, 'createdAt'>): Promise<IApiIdempotency> {
    return this.db.transaction(async (transaction) => {
      return (await this.repository.create(data, { transaction })).get({ plain: true });
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
      const identityKey = methodsArgs?.[0];
      const data = methodsArgs?.[1];

      return {
        payload: {
          id: identityKey,
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
    idempotencyKey: string,
    data: Partial<Omit<IApiIdempotency, 'createdAt' | 'id'>>,
  ): Promise<[affectedCount: number]> {
    return this.db.transaction(async (transaction) => {
      return this.repository.update(data, { transaction, where: { id: idempotencyKey } });
    });
  }

  @PrometheusOnMethod({
    labels: (params) => {
      return {
        ...params?.labels,
        method: 'destroy',
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
      const identityKey = methodsArgs?.[0];

      return {
        payload: {
          id: identityKey,
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
  public async destroy(idempotencyKey: string): Promise<number> {
    return this.db.transaction(async (transaction) => {
      return this.repository.destroy({ transaction, where: { id: idempotencyKey } });
    });
  }
}
