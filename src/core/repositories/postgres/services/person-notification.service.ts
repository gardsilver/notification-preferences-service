import { Sequelize } from 'sequelize-typescript';
import { Op, literal } from 'sequelize';
import { Inject, Injectable } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { DATABASE_DI, DB_QUERY_DURATIONS, DB_QUERY_FAILED } from 'src/modules/database';
import { DatetimeHelper } from 'src/core/app';
import {
  ICheckSendNotification,
  ICheckSendNotificationStatus,
  NotificationStatus,
  PersonChannelStatus,
} from '../types/types';
import { PersonModel } from '../entities/person.model';
import { PersonChannelModel } from '../entities/person-channel.model';
import { PersonChannelNotificationSettingsModel } from '../entities/person-channel-notification-settings.model';
import { PrometheusMetricConfigOnService, PrometheusOnMethod } from 'src/modules/prometheus';
import { ElkLoggerOnMethod, ElkLoggerOnService } from 'src/modules/elk-logger';
import { LoggerMarkers } from 'src/modules/common';

@PrometheusMetricConfigOnService({
  labels: {
    service: 'PersonNotificationService',
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
export class PersonNotificationService {
  constructor(
    @Inject(DATABASE_DI)
    private readonly db: Sequelize,
    @Inject(getModelToken(PersonModel))
    private readonly personRepository: typeof PersonModel,

    @Inject(getModelToken(PersonChannelModel))
    private readonly channelRepository: typeof PersonChannelModel,
  ) {}

  @PrometheusOnMethod({
    labels: (params) => {
      return {
        ...params?.labels,
        method: 'checkSend',
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
  async checkSend(data: ICheckSendNotification): Promise<ICheckSendNotificationStatus> {
    const person = await this.personRepository.findOne({
      where: {
        id: data.personId,
        ...(data.regionCode
          ? {
              regionCode: data.regionCode,
            }
          : {}),
      },
      attributes: ['id', 'timezone', 'regionCode'],
    });

    if (!person) {
      return {
        status: false,
        reason: data.regionCode ? 'Person not found for region' : 'Person not found',
      };
    }

    const minuteOfDay = DatetimeHelper.datetimeToLocalMinuteOfDay(data.datetime, person.timezone);

    const channels = await this.channelRepository.findAll({
      where: {
        personId: person.id,
        type: data.channelType,
        status: PersonChannelStatus.ACTIVE,
        isVerified: true,
      },
      attributes: ['id'],
      include: [
        {
          model: PersonChannelNotificationSettingsModel,
          required: true,
          attributes: ['id', 'quietRanges'],
          where: {
            type: data.notificationType,
            status: NotificationStatus.ACTIVE,
            [Op.and]: literal(`
              NOT EXISTS (
                SELECT 1
                FROM unnest(quiet_ranges) r
                WHERE ${minuteOfDay} >= lower(r)
                  AND ${minuteOfDay} < upper(r)
              )
            `),
          },
        },
      ],
    });

    if (!channels.length) {
      return {
        status: false,
        reason: 'No available channels',
      };
    }

    return {
      status: true,
      channelIds: channels.map((channel) => channel.id as string),
    };
  }
}
