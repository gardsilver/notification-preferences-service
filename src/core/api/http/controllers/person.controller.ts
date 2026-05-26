import { Controller, Post, UseInterceptors, Body, Put, Get, ParseUUIDPipe, Param } from '@nestjs/common';
import {
  ApiHeaders,
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiExtraModels,
  getSchemaPath,
  ApiParam,
} from '@nestjs/swagger';
import { GeneralAsyncContext, IGeneralAsyncContext } from 'src/modules/common';
import { GracefulShutdownOnCount } from 'src/modules/graceful-shutdown';
import { HttpGeneralAsyncContextHeaderNames } from 'src/modules/http/http-common';
import { HttpGeneralAsyncContext } from 'src/modules/http/http-server';
import { IdempotencyInterceptor, HttpHeaderNames } from 'src/core/api/common';
import { PersonService } from '../services/person.service';
import { PersonResponseData, CreatePersonRequestDto, UpdatePersonRequestDto } from '../dto/person.dto';
import { BaseResponseDto } from '../dto/base.dto';

@Controller('person')
@ApiTags('person')
@ApiBearerAuth()
@ApiHeaders([
  { name: HttpGeneralAsyncContextHeaderNames.TRACE_ID, description: 'Идентификатор трассировки', required: false },
  { name: HttpGeneralAsyncContextHeaderNames.SPAN_ID, description: 'Идентификатор Span', required: false },
  { name: HttpHeaderNames.IDEMPOTENCY_KEY, description: 'Ключ идемпотентности', required: false },
])
@UseInterceptors(IdempotencyInterceptor)
@ApiExtraModels(BaseResponseDto, PersonResponseData, CreatePersonRequestDto, UpdatePersonRequestDto)
export class HttpApiPersonController {
  constructor(private readonly service: PersonService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Получить информацию о пользователе' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID пользователя',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @ApiResponse({
    status: 201,
    description: 'Информация о пользователе',
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(PersonResponseData),
            },
          },
        },
      ],
    },
  })
  @GracefulShutdownOnCount()
  async infoPerson(
    @Param('id', ParseUUIDPipe) personId: string,
    @HttpGeneralAsyncContext() asyncContext: IGeneralAsyncContext,
  ): Promise<BaseResponseDto<PersonResponseData>> {
    return GeneralAsyncContext.instance.runWithContextAsync(async () => this.service.info(personId), asyncContext);
  }

  @Post()
  @ApiOperation({ summary: 'Добавить данные пользователя' })
  @ApiBody({ type: CreatePersonRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Запись успешно создана',
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(PersonResponseData),
            },
          },
        },
      ],
    },
  })
  @GracefulShutdownOnCount()
  async createPerson(
    @Body() dto: CreatePersonRequestDto,
    @HttpGeneralAsyncContext() asyncContext: IGeneralAsyncContext,
  ): Promise<BaseResponseDto<PersonResponseData>> {
    return GeneralAsyncContext.instance.runWithContextAsync(async () => this.service.create(dto), asyncContext);
  }

  @Put()
  @ApiOperation({ summary: 'Изменить данные пользователя' })
  @ApiBody({ type: UpdatePersonRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Запись успешно изменена',
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(PersonResponseData),
            },
          },
        },
      ],
    },
  })
  @GracefulShutdownOnCount()
  async updatePerson(
    @Body() dto: UpdatePersonRequestDto,
    @HttpGeneralAsyncContext() asyncContext: IGeneralAsyncContext,
  ): Promise<BaseResponseDto<PersonResponseData>> {
    return GeneralAsyncContext.instance.runWithContextAsync(async () => this.service.update(dto), asyncContext);
  }
}
