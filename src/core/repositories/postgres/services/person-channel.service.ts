import { CreateOptions } from 'sequelize';
import { Inject, Injectable } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { RedisCacheService } from 'src/modules/redis-cache-manager';
import { IPerson, IPersonChannel, ChannelType, IPersonChannelWithSettings } from '../types/types';
import { QuietRangesHelper } from '../helpers/quiet-ranges.helper';
import { PersonChannelModel } from '../entities/person-channel.model';
import { PersonChannelNotificationSettingsService } from './person-channel-notification-settings.service';
import { NotificationDefaultSettingsService } from './notification-default-settings.service';

@Injectable()
export class PersonChannelService {
  constructor(
    @Inject(getModelToken(PersonChannelModel))
    private readonly repository: typeof PersonChannelModel,
    private readonly notificationDefaultSettingsService: NotificationDefaultSettingsService,
    private readonly channelNotificationSettingsService: PersonChannelNotificationSettingsService,
    private readonly cache: RedisCacheService,
  ) {}

  private cacheKey(type: ChannelType, value: string): string {
    return `person_channel:exist:${type}:${value}`;
  }

  public async isExist(type: ChannelType, value: string, excludeId?: string): Promise<boolean> {
    if (excludeId) {
      const current = await this.repository.findByPk(excludeId, {
        attributes: ['id', 'type', 'value'],
      });

      if (current) {
        const currentData = current.get({ plain: true });

        if (currentData.type === type && currentData.value === value) {
          return false;
        }
      }
    }

    const cacheKey = this.cacheKey(type, value);

    const cache = (await this.cache.get(cacheKey)) as { exists: boolean } | undefined;

    if (cache !== undefined) {
      return cache.exists;
    }

    const count = await this.repository.count({
      where: {
        type,
        value,
      },
    });

    const exists = count > 0;

    await this.cache.set(
      cacheKey,
      { exists },
      { ttl: 60_000 }, // 1 минута
    );

    return exists;
  }

  public async saveList(
    person: IPerson,
    channelsData?: (Partial<IPersonChannel> &
      Pick<IPersonChannelWithSettings, 'status' | 'isVerified' | 'type' | 'value' | 'settings'>)[],
    options?: CreateOptions<IPersonChannel>,
  ): Promise<IPersonChannelWithSettings[]> {
    if (!channelsData || channelsData.length === 0) {
      return [];
    }

    const defaultOptions = await this.notificationDefaultSettingsService.findAll({
      transaction: options?.transaction,
    });

    const results: IPersonChannelWithSettings[] = [];

    for (const channelData of channelsData) {
      const { settings, ...channelPayload } = channelData;

      let channel: PersonChannelModel | null;

      // UPDATE
      if (channelPayload.id) {
        /**
         * @TODO
         *
         * Данный сценарий разрешает смену владельца канала.
         * В общем случае нужна ролевая модель на такую операцию.
         *
         */
        await this.repository.update(
          {
            ...channelPayload,
            personId: person.id,
            updatedAt: new Date(),
          },
          {
            where: {
              id: channelPayload.id,
            },
            transaction: options?.transaction,
          },
        );

        channel = await this.repository.findByPk(channelPayload.id, {
          transaction: options?.transaction,
        });
        if (!channel) {
          throw Error(`PersonChannel for ${channelPayload.id} is not exists!`);
        }
      }
      // CREATE
      else {
        channel = await this.repository.create(
          {
            ...channelPayload,
            personId: person.id,
          } as IPersonChannel,
          options,
        );
      }

      // Сохраняем настройки уведомлений
      const channelSettings = await this.channelNotificationSettingsService.saveList(
        channel,
        settings || [],
        defaultOptions,
        {
          transaction: options?.transaction,
        },
      );

      results.push({
        ...channel.get({ plain: true }),
        settings: channelSettings.map((item) => ({
          status: item.status,
          type: item.type,
          quietRanges: QuietRangesHelper.convertQuietRangesToMinutes(item.quietRanges),
        })),
      });
    }

    return results;
  }
}
