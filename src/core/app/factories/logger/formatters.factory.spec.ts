import { Test } from '@nestjs/testing';
import { ElkLoggerConfig } from 'src/modules/elk-logger';
import { HttpSecurityHeadersFormatter } from 'src/modules/http/http-common';
import { FormattersFactory } from './formatters.factory';

describe(FormattersFactory.name, () => {
  let elkLoggerConfig: ElkLoggerConfig;
  let service: FormattersFactory;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        {
          provide: ElkLoggerConfig,
          useValue: {
            isIgnoreObject: () => false,
          },
        },
        HttpSecurityHeadersFormatter,
        FormattersFactory,
      ],
    }).compile();
    elkLoggerConfig = module.get(ElkLoggerConfig);
    service = module.get(FormattersFactory);
  });

  it('init', async () => {
    expect(service).toBeDefined();
  });

  it('getFormatters', async () => {
    const formatters = service.getFormatters();
    expect(formatters).toEqual([new HttpSecurityHeadersFormatter(elkLoggerConfig)]);
  });
});
