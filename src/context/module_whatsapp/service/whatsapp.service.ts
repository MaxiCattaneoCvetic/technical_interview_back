import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as QRCode from 'qrcode';
import { EventEmitter } from 'events';
import { WhatsAppServiceInterface } from './whatsapp.service.interface';

@Injectable()
export class WhatsAppService implements OnModuleInit, WhatsAppServiceInterface {
  private client: Client;
  private readonly logger = new Logger(WhatsAppService.name);
  private qrEmitter = new EventEmitter();
  private qrGenerated = false;
  private isAuthenticated = false;
  private botPhoneNumber: string | null = null;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'my-upgrate-bot',
        dataPath: './.wwebjs_auth',
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
        ],
      },
    });

    this.registerClientEvents();
  }

  onModuleInit(): void {
    this.initializeClient();
  }

  private initializeClient(): void {
    this.client.initialize().catch(err => {
      this.logger.error('Initialization error:', err);
    });
  }

  async generateQRCode(): Promise<string> {
    if (this.qrGenerated) {
      throw new Error('QR generation already in progress');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.qrEmitter.removeAllListeners('qr');
        reject(new Error('QR generation timeout (30 seconds)'));
      }, 30000);

      this.qrEmitter.once('qr', async (qr: string) => {
        try {
          clearTimeout(timeout);
          this.logger.log('Generating QR code data URL...');
          const qrImage = await QRCode.toDataURL(qr);
          resolve(qrImage);
        } catch (err) {
          this.logger.error('QR code generation error:', err);
          reject(err);
        } finally {
          this.qrGenerated = false;
        }
      });

      if (this.client.info) {
        this.client.resetState();
      }

      this.qrGenerated = true;
    });
  }

  async getBotLink(): Promise<string | false> {
    if (this.isAuthenticated && this.botPhoneNumber) {
      return this.generateWhatsAppLink(this.botPhoneNumber);
    }

    if (this.client.info?.wid?.user) {
      this.botPhoneNumber = this.client.info.wid.user;
      return this.generateWhatsAppLink(this.botPhoneNumber);
    }

    return false;
  }

  private generateWhatsAppLink(phoneNumber: string): string {
    const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
    return `https://wa.me/${cleanNumber}`;
  }

  private registerClientEvents() {
    // this.client.on('qr', (qr) => {
    //   this.logger.log('New QR code received');
    //   this.qrEmitter.emit('qr', qr);
    // });

    this.client.on('authenticated', () => {
      this.isAuthenticated = true;
      this.logger.log('✅ WhatsApp client authenticated');
    });

    this.client.on('auth_failure', (msg) => {
      this.logger.error('❌ Authentication failed:', msg);
    });

    this.client.on('disconnected', (reason) => {
      this.isAuthenticated = false;
      this.logger.warn('⚠️ WhatsApp client disconnected:', reason);
      setTimeout(() => this.initializeClient(), 5000);
    });

    this.client.on('ready', () => {
      this.isAuthenticated = true;
      this.botPhoneNumber = this.client.info.wid.user;
      this.logger.log('🚀 WhatsApp client is ready!');
    });

    this.client.on('loading_screen', (percent, message) => {
      this.logger.debug(`Loading: ${percent}% ${message || ''}`);
    });
  }
}