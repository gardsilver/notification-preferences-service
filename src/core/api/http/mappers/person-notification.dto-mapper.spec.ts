/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { PersonNotificationDtoMapper } from './person-notification.dto-mapper';
import { ResponseStatus } from '../dto/base.dto';

// Мокаем DateTimestamp, чтобы изолировать тест от системного времени
jest.mock('src/modules/date-timestamp', () => {
  return {
    DateTimestamp: jest.fn().mockImplementation((val) => ({ value: val })),
  };
});

describe('PersonNotificationDtoMapper', () => {
  let mapper: PersonNotificationDtoMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PersonNotificationDtoMapper],
    }).compile();

    mapper = module.get<PersonNotificationDtoMapper>(PersonNotificationDtoMapper);
  });

  describe('toRepositoryInput', () => {
    it('should correctly map request DTO to repository input with DateTimestamp', () => {
      const mockDto: any = {
        personId: 'user-123',
        datetime: '2026-05-28T12:00:00Z',
      };

      const result = mapper.toRepositoryInput(mockDto);

      expect(result).toEqual({
        personId: 'user-123',
        datetime: { value: '2026-05-28T12:00:00Z' },
      });
    });
  });

  describe('toResponse', () => {
    it('should return ALLOW status and map channelIds if status is true', () => {
      const mockCanSend: any = {
        status: true,
        reason: 'All checks passed',
        channelIds: ['ch-1', 'ch-2'],
      };

      const result = mapper.toResponse(mockCanSend);

      expect(result).toEqual({
        status: ResponseStatus.ALLOW,
        details: 'All checks passed',
        data: { channelIds: ['ch-1', 'ch-2'] },
      });
    });

    it('should return DENY status and undefined data if status is false and no channelIds', () => {
      const mockCanSend: any = {
        status: false,
        reason: 'User is in quiet range',
        channelIds: null,
      };

      const result = mapper.toResponse(mockCanSend);

      expect(result).toEqual({
        status: ResponseStatus.DENY,
        details: 'User is in quiet range',
        data: undefined,
      });
    });
  });
});
