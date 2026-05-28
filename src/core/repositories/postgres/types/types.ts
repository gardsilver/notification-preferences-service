import { DateTimestamp } from 'src/modules/date-timestamp';

/* eslint-disable @typescript-eslint/no-explicit-any */
export enum PersonChannelStatus {
  DISABLED = 0,
  ACTIVE = 1,
  BLOCKED = 2,
}

export enum ChannelType {
  EMAIL = 'email',
  PHONE = 'phone',
  TELEGRAM = 'telegram',
}

export enum NotificationStatus {
  DISABLED = 0,
  ACTIVE = 1,
}

export enum NotificationType {
  MARKETING = 'marketing',
  TRANSACTIONAL = 'transactional',
  SYSTEM = 'system',
}

export interface IEntity<T = number> {
  id?: T;
  createdAt: Date;
  updatedAt: Date;
}

export interface IApiIdempotency extends Required<Omit<IEntity<string>, 'updatedAt'>> {
  requestHash: string;
  responseCode: number;
  responseBody: any;
}

export interface IPerson extends IEntity<string> {
  regionCode: string;
  timezone: string;

  birthday: string;

  lastName: string;
  firstName: string;
  middleName?: string | null;
}

export interface IPersonChannel extends IEntity<string> {
  personId: string;

  label?: string | null;

  status: PersonChannelStatus;
  isVerified: boolean;

  type: ChannelType;
  value: string;
}

export interface IPersonChannelNotificationSettings extends IEntity<string> {
  status: NotificationStatus;
  type: NotificationType;

  personChannelId: string;

  quietRanges: unknown; // Представляет int4multirange из БД
}

export interface INotificationPolicy extends IEntity<string> {
  status: NotificationStatus;
  notificationType: NotificationType;
  channelType: ChannelType;
  regionCode: string;
}

// @TODO Ограничение BIGINT!
export interface INotificationDefaultSettings extends IEntity<string> {
  type: NotificationType;
  quietRanges: unknown; // Представляет int4multirange из БД
}

export interface IQuietRanges {
  quietStart: number;
  quietFinish: number;
}

export interface IChannelSettings {
  status: NotificationStatus;
  type: NotificationType;
  quietRanges: IQuietRanges;
}

export type IPersonChannelWithSettings = IPersonChannel & { settings?: IChannelSettings[] };
export type IPersonWithChannels = IPerson & { channels: IPersonChannelWithSettings[] };

export interface INotificationDefaultSettingsResult extends INotificationDefaultSettings {
  type: NotificationType;
  quietRanges: IQuietRanges;
}

export interface ICheckSendNotification {
  personId: string;
  notificationType: NotificationType;
  channelType: ChannelType;
  regionCode?: string;
  datetime: DateTimestamp;
}

export interface ICheckSendNotificationStatus {
  status: boolean;
  reason?: string;
  channelIds?: string[];
}
