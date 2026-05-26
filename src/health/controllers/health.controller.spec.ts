import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import {
  ELK_LOGGER_SERVICE_BUILDER_DI,
  ELK_LOGGER_SERVICE_DI,
  ELK_NEST_LOGGER_SERVICE_DI,
  ElkLoggerModule,
  IElkLoggerService,
  INestElkLoggerService,
} from 'src/modules/elk-logger';
import { PrometheusManager, PrometheusModule } from 'src/modules/prometheus';
import {
  AUTH_CERTIFICATE_SERVICE_DI,
  AUTH_SERVICE_DI,
  AuthHealthIndicatorService,
  IAuthService,
  ICertificateService,
} from 'src/modules/auth';
import { DatabaseHealthIndicator } from 'src/modules/database';
import { GracefulShutdownHealthIndicatorService } from 'src/modules/graceful-shutdown';
import { RedisCacheManagerHealthIndicator } from 'src/modules/redis-cache-manager';
import { MockElkLoggerService, MockNestElkLoggerService } from 'tests/modules/elk-logger';
import { MockConfigService } from 'tests/nestjs';
import { HealthController } from './health.controller';

describe(HealthController.name, () => {
  let logger: IElkLoggerService;
  let nestLogger: INestElkLoggerService;
  let authService: IAuthService;
  let certificateService: ICertificateService;
  let prometheusManager: PrometheusManager;
  let controller: HealthController;

  beforeEach(async () => {
    jest.clearAllMocks();

    logger = new MockElkLoggerService();
    nestLogger = new MockNestElkLoggerService();

    const module = await Test.createTestingModule({
      imports: [ConfigModule, ElkLoggerModule.forRoot(), TerminusModule, PrometheusModule],
      providers: [
        {
          provide: DatabaseHealthIndicator,
          useValue: {
            isHealthy: jest.fn(async () => ({
              DataBase: {
                status: 'up',
                ping: 'ok',
                migration: 'ok',
              },
            })),
          },
        },
        {
          provide: AUTH_SERVICE_DI,
          useValue: {
            getJwtToken: jest.fn(),
          },
        },
        {
          provide: AUTH_CERTIFICATE_SERVICE_DI,
          useValue: {
            getCert: jest.fn(),
          },
        },
        {
          provide: AuthHealthIndicatorService,
          useValue: {
            isReadiness: async () => ({
              Certificate: {
                status: 'up',
                synchronized: true,
              },
            }),
          },
        },
        {
          provide: GracefulShutdownHealthIndicatorService,
          useValue: {
            isHealthy: async () => ({
              GracefulShutdown: {
                status: 'up',
                isActive: false,
              },
            }),
          },
        },
        {
          provide: RedisCacheManagerHealthIndicator,
          useValue: {
            isHealthy: async () => ({
              Redis: {
                status: 'up',
                isOpen: true,
                isReady: true,
                ping: 'PONG',
              },
            }),
          },
        },
      ],
      controllers: [HealthController],
    })
      .overrideProvider(ConfigService)
      .useValue(new MockConfigService())
      .overrideProvider(ELK_LOGGER_SERVICE_BUILDER_DI)
      .useValue({
        build: () => logger,
      })
      .overrideProvider(ELK_LOGGER_SERVICE_DI)
      .useValue(logger)
      .overrideProvider(ELK_NEST_LOGGER_SERVICE_DI)
      .useValue(nestLogger)
      .overrideProvider(PrometheusManager)
      .useValue({
        getMetrics: jest.fn(),
      })
      .compile();

    module.useLogger(nestLogger);

    authService = module.get(AUTH_SERVICE_DI);
    certificateService = module.get(AUTH_CERTIFICATE_SERVICE_DI);
    prometheusManager = module.get(PrometheusManager);
    controller = module.get(HealthController);
  });

  it('init', async () => {
    expect(authService).toBeDefined();
    expect(certificateService).toBeDefined();
    expect(prometheusManager).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('liveness', async () => {
    const dbHealth = controller['dbHealth'] as unknown as { isHealthy: jest.Mock };
    const spyDbHealth = jest.spyOn(dbHealth, 'isHealthy');

    const result = await controller.liveness();

    // Liveness передаёт migrationFailedStatus='up', чтобы падение миграций не рестартило pod.
    expect(spyDbHealth).toHaveBeenCalledWith({ migrationFailedStatus: 'up' });
    expect(result).toEqual({
      status: 'ok',
      info: {
        DataBase: {
          status: 'up',
          ping: 'ok',
          migration: 'ok',
        },
        GracefulShutdown: {
          status: 'up',
          isActive: false,
        },
        Redis: {
          status: 'up',
          isOpen: true,
          isReady: true,
          ping: 'PONG',
        },
      },
      error: {},
      details: {
        DataBase: {
          status: 'up',
          ping: 'ok',
          migration: 'ok',
        },
        GracefulShutdown: {
          status: 'up',
          isActive: false,
        },
        Redis: {
          status: 'up',
          isOpen: true,
          isReady: true,
          ping: 'PONG',
        },
      },
    });
  });

  it('readiness', async () => {
    const dbHealth = controller['dbHealth'] as unknown as { isHealthy: jest.Mock };
    const spyDbHealth = jest.spyOn(dbHealth, 'isHealthy');

    const result = await controller.readiness();

    // Readiness использует дефолт (migrationFailedStatus='down'): без опций.
    expect(spyDbHealth).toHaveBeenCalledWith();
    expect(result).toEqual({
      status: 'ok',
      info: {
        Certificate: {
          status: 'up',
          synchronized: true,
        },
        GracefulShutdown: {
          status: 'up',
          isActive: false,
        },
        DataBase: {
          status: 'up',
          ping: 'ok',
          migration: 'ok',
        },
        Redis: {
          status: 'up',
          isOpen: true,
          isReady: true,
          ping: 'PONG',
        },
      },
      error: {},
      details: {
        Certificate: {
          status: 'up',
          synchronized: true,
        },
        GracefulShutdown: {
          status: 'up',
          isActive: false,
        },
        DataBase: {
          status: 'up',
          ping: 'ok',
          migration: 'ok',
        },
        Redis: {
          status: 'up',
          isOpen: true,
          isReady: true,
          ping: 'PONG',
        },
      },
    });
  });

  it('metrics', async () => {
    jest.spyOn(prometheusManager, 'getMetrics').mockImplementation(async () => 'success');

    const result = await controller.metrics();

    expect(result).toBe('success');
  });

  it('testJwtToken', async () => {
    const spy = jest.spyOn(authService, 'getJwtToken').mockImplementation(() => 'token');
    jest.spyOn(certificateService, 'getCert').mockImplementation(async () => 'certificate');

    const result = await controller.testJwtToken();

    expect(result).toEqual({
      accessToken: 'token',
      certificate: 'certificate',
    });

    expect(spy).toHaveBeenCalledWith({
      roles: ['user'],
    });
  });
});
