import { Injectable, Logger, LoggerService } from '@nestjs/common';

@Injectable()
export class EasyStockLoggerService implements LoggerService {
  private readonly logger = new Logger('EASYSTOCK-LOGGER');
  private static instance: EasyStockLoggerService | null = null;

  public static getInstance(): EasyStockLoggerService {
    if (!EasyStockLoggerService.instance) {
      EasyStockLoggerService.instance = new EasyStockLoggerService();
    }
    return EasyStockLoggerService.instance;
  }


  log(message: string) {
    this.logger.log(message);
  }

  error(message: string, trace?: string) {
    this.logger.error(message, trace);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }

  verbose(message: string) {
    this.logger.verbose(message);
  }
}
