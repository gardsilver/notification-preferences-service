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
  CreateNotificationPolicyRequestDto,
  NotificationPolicyResponseData,
  UpdateNotificationPolicyRequestDto,
} from '../dto/notification-policy.dto';
import { NotificationPolicyService } from '../services/notification-policy.service';

@Controller('notification-policy')
@ApiTags('notification-policy')
@ApiBearerAuth()
@ApiHeaders([
  { name: HttpGeneralAsyncContextHeaderNames.TRACE_ID, description: 'Идентификатор трассировки', required: false },
  { name: HttpGeneralAsyncContextHeaderNames.SPAN_ID, description: 'Идентификатор Span', required: false },
  { name: HttpHeaderNames.IDEMPOTENCY_KEY, description: 'Ключ идемпотентности', required: false },
])
@UseInterceptors(IdempotencyInterceptor)
@ApiExtraModels(
  BaseResponseDto,
  CreateNotificationPolicyRequestDto,
  NotificationPolicyResponseData,
  UpdateNotificationPolicyRequestDto,
)
export class HttpApiNotificationPolicyController {
  constructor(private readonly service: NotificationPolicyService) {}

  @Post()
  @ApiOperation({ summary: 'Создать политику оповещения' })
  @ApiBody({ type: CreateNotificationPolicyRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Запись успешно создана',
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(NotificationPolicyResponseData),
            },
          },
        },
      ],
    },
  })
  @GracefulShutdownOnCount()
  async createPerson(
    @Body() dto: CreateNotificationPolicyRequestDto,
    @HttpGeneralAsyncContext() asyncContext: IGeneralAsyncContext,
  ): Promise<BaseResponseDto<NotificationPolicyResponseData>> {
    return GeneralAsyncContext.instance.runWithContextAsync(async () => this.service.create(dto), asyncContext);
  }

  @Put()
  @ApiOperation({ summary: 'Изменить политику оповещения' })
  @ApiBody({ type: UpdateNotificationPolicyRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Запись успешно изменена',
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(NotificationPolicyResponseData),
            },
          },
        },
      ],
    },
  })
  @GracefulShutdownOnCount()
  async updatePerson(
    @Body() dto: UpdateNotificationPolicyRequestDto,
    @HttpGeneralAsyncContext() asyncContext: IGeneralAsyncContext,
  ): Promise<BaseResponseDto<NotificationPolicyResponseData>> {
    return GeneralAsyncContext.instance.runWithContextAsync(async () => this.service.update(dto), asyncContext);
  }
}
