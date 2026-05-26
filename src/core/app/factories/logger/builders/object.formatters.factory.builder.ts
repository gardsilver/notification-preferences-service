import { BufferObjectFormatter } from 'src/modules/common/formatters';
import { ValidationErrorItemObjectFormatter } from 'src/modules/database';
import { ObjectFormattersFactory } from '../object.formatters.factory';

export abstract class ObjectFormattersFactoryBuilder {
  public static build(): ObjectFormattersFactory {
    return new ObjectFormattersFactory(new BufferObjectFormatter(), new ValidationErrorItemObjectFormatter());
  }
}
