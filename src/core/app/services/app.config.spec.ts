import { ConfigService } from '@nestjs/config';
import { MockConfigService } from 'tests/nestjs';
import { AppConfig } from './app.config';

describe(AppConfig.name, () => {
  it('default', async () => {
    const config = new MockConfigService() as unknown as ConfigService;
    const appConfig = new AppConfig(config);

    expect({
      getServicePort: appConfig.getServicePort(),
      getCorsOptions: appConfig.getCorsOptions(),
    }).toEqual({
      getServicePort: 3000,
      getCorsOptions: { origin: '*' },
    });
  });

  it('custom', async () => {
    const config = new MockConfigService({
      SERVICE_PORT: '1001',
      CORS_OPTIONS: '{}',
    }) as unknown as ConfigService;
    const appConfig = new AppConfig(config);

    expect({
      getServicePort: appConfig.getServicePort(),
      getCorsOptions: appConfig.getCorsOptions(),
    }).toEqual({
      getServicePort: 1001,
      getCorsOptions: {},
    });
  });

  it('corsOptions as empty', async () => {
    const config = new MockConfigService({
      CORS_OPTIONS: ' ',
    }) as unknown as ConfigService;
    const appConfig = new AppConfig(config);

    expect(appConfig.getCorsOptions()).toBeUndefined();
  });
});
