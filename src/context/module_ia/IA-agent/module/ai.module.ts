import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/context/module_order/models/entity/order.entity';
import { Product } from 'src/context/module_products/models/entity/product.entity';
import { AIService } from '../service/ai.service';



@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Order]),
  ],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule { } 