import { Global, Module } from '@nestjs/common';
import { EasyStockLoggerService } from './logger.service';

@Global()
@Module({
  providers: [EasyStockLoggerService],
  exports: [EasyStockLoggerService],
})
export class LoggerModule { }
