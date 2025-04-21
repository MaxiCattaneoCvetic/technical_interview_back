import { Module } from '@nestjs/common';
import { AuthModule } from '../shared/auth/auth.module';

import { WhatsAppController } from './controller/whatsap.controller';
import { WhatsAppService } from './service/whatsapp.service';

@Module({
    imports: [
        AuthModule
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
