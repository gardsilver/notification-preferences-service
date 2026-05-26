import { Test } from '@nestjs/testing';
import { BufferObjectFormatter } from 'src/modules/common/formatters';
import { ValidationErrorItemObjectFormatter } from 'src/modules/database';
import { ObjectFormattersFactory } from './object.formatters.factory';

describe(ObjectFormattersFactory.name, () => {
  let service: ObjectFormattersFactory;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [BufferObjectFormatter, ValidationErrorItemObjectFormatter, ObjectFormattersFactory],
    }).compile();
    service = module.get(ObjectFormattersFactory);
  });

  it('init', async () => {
    expect(service).toBeDefined();
  });

  it('getFormatters', async () => {
    const formatters = service.getFormatters();
    expect(formatters).toEqual([new BufferObjectFormatter(), new ValidationErrorItemObjectFormatter()]);
  });
});
