import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Product } from '../../module_products/models/entity/product.entity';

import { AIController } from './controller/ai.controller';
import { AIService } from './service/ai.service';
import { Order } from 'src/context/module_order/models/entity/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Order]),
  ],
  controllers: [AIController],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule { } 