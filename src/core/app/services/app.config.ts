import { Injectable } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfig {
  private servicePort: string;
  private corsOptions: string;

  constructor(private readonly configService: ConfigService) {
    this.servicePort = this.configService.get<string>('SERVICE_PORT', '3000').trim();
    this.corsOptions = this.configService.get<string>('CORS_OPTIONS', '{"origin":"*"}').trim();
  }

  getServicePort(): number {
    return Number(this.servicePort);
  }

  getCorsOptions(): CorsOptions | undefined {
    return this.corsOptions ? JSON.parse(this.corsOptions) : undefined;
  }
}
