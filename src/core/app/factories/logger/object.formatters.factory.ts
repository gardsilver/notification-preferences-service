import { Injectable } from '@nestjs/common';
import { BufferObjectFormatter } from 'src/modules/common/formatters';
import { BaseObjectFormatter } from 'src/modules/elk-logger';
import { ValidationErrorItemObjectFormatter } from 'src/modules/database';

@Injectable()
export class ObjectFormattersFactory {
  constructor(
    protected readonly bufferObjectFormatter: BufferObjectFormatter,
    protected readonly validationErrorItemObjectFormatter: ValidationErrorItemObjectFormatter,
  ) {}

  getFormatters(): BaseObjectFormatter[] {
    return [this.bufferObjectFormatter, this.validationErrorItemObjectFormatter];
  }
}
