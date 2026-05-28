import { BaseError, ValidationErrorItem } from 'sequelize';
import { Injectable, BadRequestException, InternalServerErrorException, Inject } from '@nestjs/common';
import { ELK_LOGGER_SERVICE_BUILDER_DI, IElkLoggerService, IElkLoggerServiceBuilder } from 'src/modules/elk-logger';
import { ResponseStatus } from '../dto/base.dto';

@Injectable()
export class ErrorHandler {
  private readonly logger: IElkLoggerService;

  constructor(
    @Inject(ELK_LOGGER_SERVICE_BUILDER_DI)
    loggerBuilder: IElkLoggerServiceBuilder,
  ) {
    this.logger = loggerBuilder.build({
      module: ErrorHandler.name,
    });
  }

  public handle(error: unknown, entityName: string): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'SequelizeUniqueConstraintError'
    ) {
      throw new BadRequestException({
        status: ResponseStatus.ERROR,
        details: `${entityName} with these unique fields already exists.`,
      });
    }

    if (this.isDatabaseError(error)) {
      throw new InternalServerErrorException({
        status: ResponseStatus.ERROR,
        details: `Internal database error occurred while processing ${entityName}.`,
      });
    }

    this.logger.error(`[ErrorHandler] Unexpected non-database error during ${entityName} processing`, {
      payload: {
        entityName,
        error,
      },
    });

    throw new InternalServerErrorException({
      status: ResponseStatus.ERROR,
      details: `Internal error`,
    });
  }

  protected isDatabaseError(error: unknown): boolean {
    return error instanceof BaseError || error instanceof ValidationErrorItem;
  }
}
