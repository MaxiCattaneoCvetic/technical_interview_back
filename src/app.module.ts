import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { WhatsAppModule } from './context/module_whatsapp/whatsapp.module';
import { UserModule } from './context/module_user/user.module';
import { databaseConfig } from './context/shared/database/config/database.config';
import { AuthModule } from './context/shared/auth/auth.module';
import { AIModule } from './context/module_ia/IA-agent/ai.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(databaseConfig),
    AIModule,
    AuthModule,
    WhatsAppModule,
    UserModule,

  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
