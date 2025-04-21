import { Controller, Get, Inject, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { WhatsAppServiceInterface } from '../service/whatsapp.service.interface';
import { AuthGuard } from 'src/context/shared/auth/guard/auth.guard';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    @Inject("WhatsAppServiceInterface")
    private readonly whatsAppService: WhatsAppServiceInterface
  ) { }

  @Get('qrcode')
  @UseGuards(AuthGuard)
  async getQRCode(@Res() res: Response) {
    try {
      const qrCodeData = await this.whatsAppService.generateQRCode();

      if (!qrCodeData || !qrCodeData.startsWith('data:image/png;base64')) {
        throw new Error('Formato de QR inválido');
      }

      res.status(200).json({
        success: true,
        qrCode: qrCodeData,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al generar el QR'
      });
    }
  }

  @Get('bot-link',)
  async getBotLink(@Res() res: Response) {
    try {
      const link = await this.whatsAppService.getBotLink();

      if (link) {
        res.status(200).json({
          success: true,
          link: link
        });
      } else {
        res.status(200).json({
          success: false,
          message: 'El bot no ha sido autenticado aún'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al verificar estado del bot'
      });
    }
  }
}