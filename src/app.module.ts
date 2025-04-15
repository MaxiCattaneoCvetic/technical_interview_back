import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { WhatsAppModule } from './context/module_whatsapp/whatsapp.module';
import { UserModule } from './context/module_user/user.module';
import { databaseConfig } from './context/shared/database/config/database.config';
import { Order } from './context/module_order/models/entity/order.entity';
import { Product } from './context/module_products/models/entity/product.entity';
import { AuthModule } from './context/shared/auth/auth.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([Product, Order]),
    AuthModule,
    WhatsAppModule,
    UserModule,

  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
