import { Transactionable } from 'sequelize';
import { Inject, Injectable } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { enumValues } from 'src/modules/common/utils';
import {
  IChannelSettings,
  INotificationDefaultSettings,
  IPersonChannelNotificationSettings,
  IQuietRanges,
  NotificationType,
} from '../types/types';
import { PersonChannelNotificationSettingsModel } from '../entities/person-channel-notification-settings.model';
import { PersonChannelModel } from '../entities/person-channel.model';
import { QuietRangesHelper } from '../helpers/quiet-ranges.helper';

const listPersonNotificationTypes = enumValues(NotificationType) as NotificationType[];

@Injectable()
export class PersonChannelNotificationSettingsService {
  constructor(
    @Inject(getModelToken(PersonChannelNotificationSettingsModel))
    private readonly repository: typeof PersonChannelNotificationSettingsModel,
  ) {}

  public async saveList(
    channel: PersonChannelModel,
    usedSettingsData: Partial<IChannelSettings>[],
    defaultOptions: INotificationDefaultSettings[],
    options?: Transactionable,
  ): Promise<IPersonChannelNotificationSettings[]> {
    if (usedSettingsData.length === 0) {
      return [];
    }

    const settings = await channel.$get('settings', {
      transaction: options?.transaction,
    });

    const list: IPersonChannelNotificationSettings[] = [];

    for (const notificationType of listPersonNotificationTypes) {
      const use = usedSettingsData.find((opt) => opt.type === notificationType);

      if (use === undefined) {
        continue;
      }

      const exist = settings.find((opt) => opt.type === notificationType);

      if (exist) {
        const settingsDataForUpdate: Partial<IPersonChannelNotificationSettings> = {};

        if (use.status !== undefined) {
          settingsDataForUpdate.status = use.status;
        }

        if (use.quietRanges !== undefined) {
          settingsDataForUpdate.quietRanges = QuietRangesHelper.convertMinutesToQuietRanges(
            use.quietRanges.quietStart,
            use.quietRanges.quietFinish,
          );
        }

        if (Object.keys(settingsDataForUpdate).length) {
          settingsDataForUpdate.updatedAt = new Date();
          await this.repository.update(settingsDataForUpdate, {
            transaction: options?.transaction,
            where: {
              id: exist.id,
            },
          });
        }

        const savedSettings = await this.repository.findByPk(exist.id, { transaction: options?.transaction });
        if (!savedSettings) {
          throw Error(`Settings for channel ${channel.id} and notification type ${notificationType} is not exists!`);
        }

        list.push(savedSettings.get({ plain: true }));

        continue;
      }

      const matchedDefaultOption = defaultOptions.find((defaultOption) => defaultOption.type === notificationType);

      const hasCustomQuietRanges = use.quietRanges && use.quietRanges.quietStart !== undefined;

      let finalQuietRanges: unknown;

      if (hasCustomQuietRanges) {
        finalQuietRanges = QuietRangesHelper.convertMinutesToQuietRanges(
          use.quietRanges!.quietStart,
          use.quietRanges!.quietFinish,
        );
      } else if (matchedDefaultOption) {
        const defaultQuietRanges = matchedDefaultOption.quietRanges;

        if (defaultQuietRanges && typeof defaultQuietRanges === 'object') {
          finalQuietRanges = QuietRangesHelper.convertMinutesToQuietRanges(
            (defaultQuietRanges as IQuietRanges).quietStart,
            (defaultQuietRanges as IQuietRanges).quietFinish,
          );
        } else if (typeof defaultQuietRanges === 'string') {
          finalQuietRanges = defaultQuietRanges;
        }
      }

      const settingsDataForCreate: Partial<IPersonChannelNotificationSettings> = {
        status: use.status,
        type: use.type,
        personChannelId: channel.id,
        quietRanges: finalQuietRanges, // Передаем корректно сформированную строку
      };

      const savedSettings = await this.repository.create(
        settingsDataForCreate as unknown as IPersonChannelNotificationSettings,
        { transaction: options?.transaction },
      );

      list.push(savedSettings.get({ plain: true }));
    }

    return list;
  }
}
