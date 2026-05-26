import { Controller, Post, UseInterceptors, Body, Put } from '@nestjs/common';
import {
  ApiHeaders,
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { GeneralAsyncContext, IGeneralAsyncContext } from 'src/modules/common';
import { GracefulShutdownOnCount } from 'src/modules/graceful-shutdown';
import { HttpGeneralAsyncContextHeaderNames } from 'src/modules/http/http-common';
import { HttpGeneralAsyncContext } from 'src/modules/http/http-server';
import { IdempotencyInterceptor, HttpHeaderNames } from 'src/core/api/common';
import { BaseResponseDto } from '../dto/base.dto';
import {
  CreateNotificationDefaultSettingsRequestDto,
  NotificationDefaultSettingsResponseData,
  UpdateNotificationDefaultSettingsRequestDto,
} from '../dto/notification-default-settings.dto';
import { NotificationDefaultSettingsService } from '../services/notification-default-settings.service';

@Controller('notification-default-settings')
@ApiTags('notification-default-settings')
@ApiBearerAuth()
@ApiHeaders([
  { name: HttpGeneralAsyncContextHeaderNames.TRACE_ID, description: 'Идентификатор трассировки', required: false },
  { name: HttpGeneralAsyncContextHeaderNames.SPAN_ID, description: 'Идентификатор Span', required: false },
  { name: HttpHeaderNames.IDEMPOTENCY_KEY, description: 'Ключ идемпотентности', required: false },
])
@UseInterceptors(IdempotencyInterceptor)
@ApiExtraModels(
  BaseResponseDto,
  NotificationDefaultSettingsResponseData,
  CreateNotificationDefaultSettingsRequestDto,
  UpdateNotificationDefaultSettingsRequestDto,
)
export class HttpApiNotificationDefaultSettingsController {
  constructor(private readonly service: NotificationDefaultSettingsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать параметры оповещений по умолчанию' })
  @ApiBody({ type: CreateNotificationDefaultSettingsRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Запись успешно создана',
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(NotificationDefaultSettingsResponseData),
            },
          },
        },
      ],
    },
  })
  @GracefulShutdownOnCount()
  async createPerson(
    @Body() dto: CreateNotificationDefaultSettingsRequestDto,
    @HttpGeneralAsyncContext() asyncContext: IGeneralAsyncContext,
  ): Promise<BaseResponseDto<NotificationDefaultSettingsResponseData>> {
    return GeneralAsyncContext.instance.runWithContextAsync(async () => this.service.create(dto), asyncContext);
  }

  @Put()
  @ApiOperation({ summary: 'Изменить параметры оповещений по умолчанию' })
  @ApiBody({ type: UpdateNotificationDefaultSettingsRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Запись успешно изменена',
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(NotificationDefaultSettingsResponseData),
            },
          },
        },
      ],
    },
  })
  @GracefulShutdownOnCount()
  async updatePerson(
    @Body() dto: UpdateNotificationDefaultSettingsRequestDto,
    @HttpGeneralAsyncContext() asyncContext: IGeneralAsyncContext,
  ): Promise<BaseResponseDto<NotificationDefaultSettingsResponseData>> {
    return GeneralAsyncContext.instance.runWithContextAsync(async () => this.service.update(dto), asyncContext);
  }
}
