import { Test, TestingModule } from '@nestjs/testing';
import { ChannelType, NotificationStatus, NotificationType, INotificationPolicy } from 'src/core/repositories/postgres';
import { ResponseStatus } from '../dto/base.dto';
import { NotificationPolicyMapper } from './notification-policy.dto-mapper';

describe('NotificationPolicyMapper', () => {
  let mapper: NotificationPolicyMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationPolicyMapper],
    }).compile();

    mapper = module.get<NotificationPolicyMapper>(NotificationPolicyMapper);
  });

  it('should be defined', () => {
    expect(mapper).toBeDefined();
  });

  describe('toRepositoryInput', () => {
    it('should correctly map Create DTO to partial repository entity', () => {
      const mockCreateDto = {
        status: NotificationStatus.ACTIVE,
        notificationType: NotificationType.MARKETING,
        channelType: ChannelType.EMAIL,
        regionCode: 'RU',
      };

      const result = mapper.toRepositoryInput(mockCreateDto);

      expect(result).toEqual({
        status: NotificationStatus.ACTIVE,
        notificationType: NotificationType.MARKETING,
        channelType: ChannelType.EMAIL,
        regionCode: 'RU',
      });
    });

    it('should correctly map Update DTO and keep additional update fields', () => {
      const mockUpdateDto = {
        id: 'uuid-123-id',
        status: NotificationStatus.DISABLED,
        notificationType: NotificationType.SYSTEM,
        channelType: ChannelType.TELEGRAM,
        regionCode: 'KZ',
      };

      const result = mapper.toRepositoryInput(mockUpdateDto);

      expect(result).toEqual({
        id: 'uuid-123-id',
        status: NotificationStatus.DISABLED,
        notificationType: NotificationType.SYSTEM,
        channelType: ChannelType.TELEGRAM,
        regionCode: 'KZ',
      });
    });
  });

  describe('toResponse', () => {
    it('should wrap entity into BaseResponseDto and strictly strip createdAt and updatedAt fields', () => {
      const mockDbEntity: Required<INotificationPolicy> = {
        id: 'policy-uuid-v4',
        status: NotificationStatus.ACTIVE,
        notificationType: NotificationType.TRANSACTIONAL,
        channelType: ChannelType.PHONE,
        regionCode: 'RU',
        createdAt: new Date('2026-05-28T12:00:00.000Z'),
        updatedAt: new Date('2026-05-29T12:00:00.000Z'),
      };

      const result = mapper.toResponse(mockDbEntity);

      expect(result).toEqual({
        status: ResponseStatus.SUCCESS,
        data: {
          id: 'policy-uuid-v4',
          status: NotificationStatus.ACTIVE,
          notificationType: NotificationType.TRANSACTIONAL,
          channelType: ChannelType.PHONE,
          regionCode: 'RU',
          createdAt: undefined,
          updatedAt: undefined,
        },
      });

      // Дополнительно проверяем, что свойства фактически выставлены в undefined
      expect(result.data).not.toHaveProperty('createdAt', expect.any(Date));
      expect(result.data).not.toHaveProperty('updatedAt', expect.any(Date));
    });
  });
});
