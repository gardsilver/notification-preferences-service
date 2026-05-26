/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test } from '@nestjs/testing';
import { API_IDEMPOTENCY_SERVICE_TOKEN } from 'src/core/repositories/postgres';
import { HttpApiPersonController } from './person.controller';
import { PersonService } from '../services/person.service';

const mockPersonService = {
  info: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

describe('HttpApiPersonController', () => {
  let controller: HttpApiPersonController;
  let service: typeof mockPersonService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HttpApiPersonController],
      providers: [
        {
          provide: PersonService,
          useValue: mockPersonService,
        },
        {
          provide: API_IDEMPOTENCY_SERVICE_TOKEN,
          useValue: {
            findByPk: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(undefined),
            update: jest.fn().mockResolvedValue(undefined),
            destroy: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(HttpApiPersonController);
    service = moduleRef.get(PersonService);
  });

  it('should return person info', async () => {
    const result = {
      data: {
        id: '1',
        firstName: 'Ivan',
      },
    };

    service.info.mockResolvedValue(result);

    const res = await controller.infoPerson('00000000-0000-0000-0000-000000000000', {} as any);

    expect(service.info).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000000');

    expect(res).toEqual(result);
  });

  it('should create person', async () => {
    const dto = {
      firstName: 'Ivan',
      lastName: 'Ivanov',
      birthday: '1990-01-01',
      regionCode: 'RU',
      timezone: 'Europe/Moscow',
      channels: [],
    };

    const result = {
      data: { id: '1' },
    };

    service.create.mockResolvedValue(result);

    const res = await controller.createPerson(dto as any, {} as any);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(res).toEqual(result);
  });

  it('should update person', async () => {
    const dto = {
      id: '00000000-0000-0000-0000-000000000000',
      firstName: 'Ivan',
    };

    const result = {
      data: { id: dto.id },
    };

    service.update.mockResolvedValue(result);

    const res = await controller.updatePerson(dto as any, {} as any);

    expect(service.update).toHaveBeenCalledWith(dto);
    expect(res).toEqual(result);
  });

  it('should propagate service error on create', async () => {
    service.create.mockRejectedValue(new Error('fail'));

    await expect(controller.createPerson({} as any, {} as any)).rejects.toThrow('fail');
  });

  it('should propagate service error on update', async () => {
    service.update.mockRejectedValue(new Error('fail'));

    await expect(controller.updatePerson({ id: '1' } as any, {} as any)).rejects.toThrow('fail');
  });

  it('should propagate service error on info', async () => {
    service.info.mockRejectedValue(new Error('fail'));

    await expect(controller.infoPerson('id', {} as any)).rejects.toThrow('fail');
  });
});
