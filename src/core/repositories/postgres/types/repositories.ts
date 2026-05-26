import { Provider } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { PersonModel } from '../entities/person.model';
import { PersonChannelModel } from '../entities/person-channel.model';
import { PersonChannelNotificationSettingsModel } from '../entities/person-channel-notification-settings.model';
import { ApiIdempotencyModel } from '../entities/api-idempotency.model';
import { NotificationDefaultSettingsModel } from '../entities/notification-default-settings.model';

export const REPOSITORIES: Provider[] = [
  {
    provide: getModelToken(ApiIdempotencyModel),
    useValue: ApiIdempotencyModel,
  },
  {
    provide: getModelToken(PersonModel),
    useValue: PersonModel,
  },
  {
    provide: getModelToken(PersonChannelModel),
    useValue: PersonChannelModel,
  },
  {
    provide: getModelToken(PersonChannelNotificationSettingsModel),
    useValue: PersonChannelNotificationSettingsModel,
  },
  {
    provide: getModelToken(NotificationDefaultSettingsModel),
    useValue: NotificationDefaultSettingsModel,
  },
];
