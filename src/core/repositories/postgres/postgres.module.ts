import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from 'src/modules/database';
import { ElkLoggerModule } from 'src/modules/elk-logger';
import { PrometheusModule } from 'src/modules/prometheus';
import { PersonModel } from './entities/person.model';
import { PersonChannelModel } from './entities/person-channel.model';
import { PersonChannelNotificationSettingsModel } from './entities/person-channel-notification-settings.model';
import { REPOSITORIES } from './types/repositories';
import { ApiIdempotencyService } from './services/api-idempotency.service';
import { PersonService } from './services/person.service';
import { ApiIdempotencyModel } from './entities/api-idempotency.model';
import { API_IDEMPOTENCY_SERVICE_TOKEN } from './types/tokens';
import { NotificationDefaultSettingsModel } from './entities/notification-default-settings.model';
import { NotificationDefaultSettingsService } from './services/notification-default-settings.service';
import { PersonChannelService } from './services/person-channel.service';
import { RedisCacheManagerModule } from 'src/modules/redis-cache-manager';
import { PersonChannelNotificationSettingsService } from './services/person-channel-notification-settings.service';
import { PersonNotificationService } from './services/person-notification.service';

@Module({
  imports: [
    ConfigModule,
    ElkLoggerModule,
    PrometheusModule,
    RedisCacheManagerModule,
    DatabaseModule.forRoot({
      models: [
        ApiIdempotencyModel,
        PersonModel,
        PersonChannelModel,
        PersonChannelNotificationSettingsModel,
        NotificationDefaultSettingsModel,
      ],
    }),
  ],
  providers: [
    ...REPOSITORIES,
    {
      provide: API_IDEMPOTENCY_SERVICE_TOKEN,
      useClass: ApiIdempotencyService,
    },
    PersonChannelNotificationSettingsService,
    PersonChannelService,
    PersonService,
    PersonNotificationService,
    NotificationDefaultSettingsService,
  ],
  exports: [
    API_IDEMPOTENCY_SERVICE_TOKEN,
    PersonService,
    PersonNotificationService,
    NotificationDefaultSettingsService,
  ],
})
export class PostgresModule {}
