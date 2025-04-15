import { Module } from '@nestjs/common';
import { WhatsAppModule } from './context/module_whatsapp/whatsapp.module';


@Module({
  imports: [WhatsAppModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
