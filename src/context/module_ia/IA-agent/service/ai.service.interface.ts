export interface AIServiceInterface {
    processMessage(userMessage: string, clientId: string): Promise<string>
    
}
