import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';


import { Product } from '../../../module_products/models/entity/product.entity';
import { AIServiceInterface } from './ai.service.interface';
import axios from 'axios';
import { generateSystemPrompt } from './prompt/ia.prompt';

interface ChatSession {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  lastUpdated: Date;
  systemPrompt?: string; // Campo añadido para almacenar el system prompt
}

@Injectable()
export class AIService implements AIServiceInterface {
  private openai: OpenAI;
  private chatSessions: Map<string, ChatSession> = new Map();
  private readonly model = "llama3-70b-8192";

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set in environment variables');
    }
    this.openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
      defaultHeaders: {
        'Content-Type': 'application/json',
      },
    });
  }

  private getOrCreateSession(clientId: string): ChatSession {
    let session = this.chatSessions.get(clientId);

    if (!session) {
      session = {
        messages: [],
        lastUpdated: new Date(),
      };
      this.chatSessions.set(clientId, session);
    }

    return session;
  }

  private async createOrderInMicroservice(orderData: any): Promise<void> {
    try {
      const backendUrl = this.configService.get<string>('BACKEND_URL_DATABASE');
      const apiKey = this.configService.get<string>('API_KEY_ORDERS');

      if (!backendUrl || !apiKey) {
        throw new Error('Missing required environment variables');
      }

      const orderPayload = {
        customerName: orderData.customerName,
        items: orderData.items.map((item: any) => ({
          code: item.code,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: orderData.totalAmount,
        status: 'pending'
      };

      const response = await axios.post(`${backendUrl}/order`, orderPayload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-api-key': apiKey
        },
        timeout: 5000
      });
      console.log(response);

      return response.data.data.orderId;
    } catch (error) {
      console.error('Error creating order:', {
        error: error.message,
        response: error.response?.data,
        orderData: {
          ...orderData,
          items: orderData.items.map((i: any) => ({
            code: i.code,
            quantity: i.quantity
          }))
        }
      });
      throw error;
    }
  }

  private isOrderConfirmation(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return lowerMessage.includes('si') ||
      lowerMessage.includes('sí') ||
      lowerMessage.includes('confirmar');
  }

  private isOrderRejection(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return lowerMessage.includes('no') ||
      lowerMessage.includes('cancelar');
  }

  async processMessage(userMessage: string, clientId: string): Promise<string> {
    const session = this.getOrCreateSession(clientId);

    try {
      // 1. Inicializar system prompt solo en primer mensaje
      if (!session.systemPrompt) {
        const products = await this.productRepository.find({
          select: ['id', 'code', 'type', 'size', 'color', 'availableQuantity', 'price50', 'price100', 'price200']
        });
        session.systemPrompt = generateSystemPrompt(products);
      }

      // 2. Registrar mensaje del usuario
      const cleanMessage = userMessage.trim();
      session.messages.push({
        role: 'user' as const,
        content: cleanMessage
      });

      // 3. Preparar mensajes para la API
      const apiMessages = [
        { role: "system" as const, content: session.systemPrompt },
        ...session.messages.slice(-5) // Mantener contexto conversación
      ];

      // 4. Llamar a la API de IA
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: apiMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content || ''
        })),
        temperature: 0.7,
        max_tokens: 200,
        top_p: 0.9,
        frequency_penalty: 0.5,
        presence_penalty: 0.5
      });

      if (!response?.choices[0]?.message?.content) {
        throw new Error('Empty AI response');
      }

      const aiResponse = response.choices[0].message.content.trim();

      // 5. Registrar respuesta del asistente
      session.messages.push({
        role: 'assistant' as const,
        content: aiResponse
      });

      // 6. Procesar posible pedido
      let orderResult = '';
      const jsonMatch = aiResponse.match(/<json>([\s\S]*?)<\/json>/);

      if (jsonMatch) {
        try {
          const jsonString = jsonMatch[1];
          const orderData = JSON.parse(jsonString);
          const lastUserMessage = session.messages[session.messages.length - 2].content.toLowerCase();

          if (this.isOrderConfirmation(lastUserMessage)) {
            const orderId = await this.createOrderInMicroservice(orderData);
            orderResult = `\n✅ Pedido confirmado y registrado. Código de pedido: ${orderId}. Conservalo para consultar el estado del pedido.`;
          } else if (this.isOrderRejection(lastUserMessage)) {
            orderResult = '\n❌ Pedido no confirmado';
          }
        } catch (e) {
          console.error('JSON parse error:', {
            error: e.message,
            json: jsonMatch[0]
          });
        }
      }

      session.lastUpdated = new Date();
      return aiResponse + orderResult;

    } catch (error) {
      console.error('ProcessMessage error:', {
        clientId,
        error: error.message,
        lastMessages: session.messages.slice(-2)
      });

      // Mensajes de error mejorados
      if (error.message.includes('rate limit')) {
        return '⚠️ Límite de solicitudes alcanzado. Por favor espera un momento.';
      } else if (axios.isAxiosError(error)) {
        return '🔌 Error de conexión con el servidor. Intenta nuevamente.';
      } else {
        return '❌ Ocurrió un error. Por favor intenta de nuevo.';
      }
    }
  }
}