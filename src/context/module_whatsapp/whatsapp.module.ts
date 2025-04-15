import { Module } from '@nestjs/common';


import { WhatsAppController } from './controller/whatsap.controller';
import { WhatsAppService } from './service/whatsapp.service';

@Module({
    imports: [
    ],
    controllers: [WhatsAppController],
    providers: [
        {
            provide: 'WhatsAppServiceInterface',
            useClass: WhatsAppService
        }
    ],
})
export class WhatsAppModule { }
