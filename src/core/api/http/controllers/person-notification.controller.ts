import { Controller, Post, UseInterceptors, Body } from '@nestjs/common';
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
import { GeneralAsyncContext, IGeneralAsyncContext, SkipInterceptors } from 'src/modules/common';
import { GracefulShutdownOnCount } from 'src/modules/graceful-shutdown';
import { HttpGeneralAsyncContextHeaderNames } from 'src/modules/http/http-common';
import { HttpGeneralAsyncContext } from 'src/modules/http/http-server';
import { IdempotencyInterceptor, HttpHeaderNames } from 'src/core/api/common';
import { BaseResponseDto } from '../dto/base.dto';
import { PersonalCheckSendNotificationRequestDto } from '../dto/personal-check-send-notification.dto';
import { PersonNotificationService } from '../services/person-notification.service';

@Controller('person-notification')
@ApiTags('person-notification')
@ApiBearerAuth()
@ApiHeaders([
  { name: HttpGeneralAsyncContextHeaderNames.TRACE_ID, description: 'Идентификатор трассировки', required: false },
  { name: HttpGeneralAsyncContextHeaderNames.SPAN_ID, description: 'Идентификатор Span', required: false },
  { name: HttpHeaderNames.IDEMPOTENCY_KEY, description: 'Ключ идемпотентности', required: false },
])
@UseInterceptors(IdempotencyInterceptor)
@ApiExtraModels(BaseResponseDto, PersonalCheckSendNotificationRequestDto)
export class HttpApiPersonNotificationController {
  constructor(private readonly service: PersonNotificationService) {}

  @Post('check-send')
  @ApiOperation({ summary: 'Проверка возможности отправки уведомления пользователю' })
  @ApiBody({ type: PersonalCheckSendNotificationRequestDto })
  @ApiResponse({
    status: 201,
    schema: {
      allOf: [{ $ref: getSchemaPath(BaseResponseDto) }],
    },
  })
  @SkipInterceptors(IdempotencyInterceptor)
  @GracefulShutdownOnCount()
  async checkSend(
    @Body() dto: PersonalCheckSendNotificationRequestDto,
    @HttpGeneralAsyncContext() asyncContext: IGeneralAsyncContext,
  ): Promise<BaseResponseDto> {
    return GeneralAsyncContext.instance.runWithContextAsync(async () => this.service.checkSend(dto), asyncContext);
  }
}
