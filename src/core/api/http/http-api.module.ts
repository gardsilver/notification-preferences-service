import { Module } from '@nestjs/common';
import { CommonApiModule } from 'src/core/api/common';
import { PostgresModule } from 'src/core/repositories/postgres';
import { PersonService } from './services/person.service';
import { HttpApiPersonController } from './controllers/person.controller';
import { HttpApiNotificationDefaultSettingsController } from './controllers/notification-default-settings.controller';
import { NotificationDefaultSettingsService } from './services/notification-default-settings.service';
import { IsChannelValueValidConstraint } from './validators/person-channel.validator';
import { PersonNotificationService } from './services/person-notification.service';
import { HttpApiPersonNotificationController } from './controllers/person-notification.controller';

@Module({
  imports: [PostgresModule, CommonApiModule],
  providers: [
    PersonService,
    NotificationDefaultSettingsService,
    PersonNotificationService,
    IsChannelValueValidConstraint,
  ],
  controllers: [
    HttpApiPersonController,
    HttpApiNotificationDefaultSettingsController,
    HttpApiPersonNotificationController,
  ],
})
export class HttpApiModule {}
