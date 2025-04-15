export interface WhatsAppServiceInterface {
    generateQRCode(): Promise<string>;
    getBotLink(): Promise<string | false>
}
