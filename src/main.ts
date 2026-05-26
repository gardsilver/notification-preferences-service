import { join } from 'path';
import cookieParser from 'cookie-parser';
import { useContainer } from 'class-validator';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  ELK_NEST_LOGGER_SERVICE_DI,
  NestElkLoggerServiceBuilder,
  ELK_LOGGER_SERVICE_BUILDER_DI,
  ElkLoggerConfig,
} from 'src/modules/elk-logger';
import { BEARER_NAME } from 'src/modules/http/http-common';
import {
  HttpAuthGuard,
  HttpErrorResponseFilter,
  HttpHeadersResponse,
  HttpLogging,
  HttpPrometheus,
} from 'src/modules/http/http-server';
import { LoggingValidationPipe } from 'src/modules/hybrid/hybrid-server';
import {
  GLOBAL_ROUTE_PREFIX,
  AppConfig,
  ErrorFormattersFactoryBuilder,
  IgnoreObjectsFactoryBuilder,
  ObjectFormattersFactoryBuilder,
  FormattersFactoryBuilder,
} from 'src/core/app';
import { MainModule } from 'src/main.module';

async function bootstrap(): Promise<void> {
  const initConfigService = new ConfigService();
  let nestLogger = NestElkLoggerServiceBuilder.build({
    configService: initConfigService,
    formattersOptions: {
      sortFields: ['timestamp', 'level', 'module', 'message', 'traceId', 'payload'],
      ignoreObjects: IgnoreObjectsFactoryBuilder.build().getCheckObjects(),
      exceptionFormatters: ErrorFormattersFactoryBuilder.build().getFormatters(),
      objectFormatters: ObjectFormattersFactoryBuilder.build().getFormatters(),
    },
    formatters: (elkLoggerConfig: ElkLoggerConfig) => {
      return FormattersFactoryBuilder.build({ elkLoggerConfig }).getFormatters();
    },
  });

  const app = await NestFactory.create<NestExpressApplication>(MainModule, { logger: nestLogger, bufferLogs: true });

  app.useStaticAssets(join(__dirname, '../front/static'));
  app.setBaseViewsDir(join(__dirname, '../front/views'));
  app.setViewEngine('ejs');

  nestLogger = app.get(ELK_NEST_LOGGER_SERVICE_DI);
  app.useLogger(nestLogger);
  app.flushLogs();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
    new LoggingValidationPipe(app.get(ELK_LOGGER_SERVICE_BUILDER_DI)),
  );

  app.useGlobalFilters(app.get(HttpErrorResponseFilter));

  app.useGlobalGuards(app.get(HttpAuthGuard));
  app.useGlobalInterceptors(app.get(HttpLogging), app.get(HttpPrometheus), app.get(HttpHeadersResponse));

  const appConfig = app.get(AppConfig);

  app.enableCors(appConfig.getCorsOptions());
  app.use(cookieParser());
  app.setGlobalPrefix(GLOBAL_ROUTE_PREFIX, {
    exclude: [
      { path: 'health{*path}', method: RequestMethod.ALL },
      { path: 'chat{*path}', method: RequestMethod.ALL },
    ],
  });

  const document = new DocumentBuilder()
    .setTitle('Notification Preferences Service')
    .setDescription('REST API')
    .addBearerAuth({
      type: 'http',
      scheme: BEARER_NAME.toLocaleLowerCase(),
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Введите JWT токен',
      in: 'header',
    })
    .build();
  const documentation = SwaggerModule.createDocument(app, document);
  const customOption: SwaggerCustomOptions = {
    swaggerOptions: {
      withCredentials: true,
    },
  };

  SwaggerModule.setup('/', app, documentation, customOption);

  app.enableShutdownHooks();

  useContainer(app.select(MainModule), { fallbackOnErrors: true });

  await app.init();
  // В начале открываем REST API для доступности Health Checks, логов и метрик.
  await app.listen(appConfig.getServicePort());
  // Запускаем все дополнительные службы - их состояние будет отражено в Health Checks, логах и метриках.
  await app.startAllMicroservices();
}

bootstrap();
