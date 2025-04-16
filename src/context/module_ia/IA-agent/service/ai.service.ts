import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../../module_products/models/entity/product.entity';

import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Order } from 'src/context/module_order/models/entity/order.entity';

interface ChatSession {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  lastUpdated: Date;
}

@Injectable()
export class AIService {
  private openai: OpenAI;
  private chatSessions: Map<string, ChatSession> = new Map();

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
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
    if (!this.chatSessions.has(clientId)) {
      this.chatSessions.set(clientId, {
        messages: [],
        lastUpdated: new Date(),
      });
    }
    return this.chatSessions.get(clientId)!;
  }

  private generatePrompt(products: Product[], userMessage: string): string {
    return `Eres un agente de ventas B2B especializado en ropa. Tienes acceso a la siguiente información de productos:

${products.map(p => `Producto: ${p.type} (${p.size}, ${p.color}), Código: ${p.code}, Precio 50+: $${p.price50}, Precio 100+: $${p.price100}, Precio 200+: $${p.price200}, Disponible: ${p.availableQuantity}`).join('\n')}

El cliente dice: "${userMessage}"

  Responde de manera profesional y concisa, sugiriendo productos relevantes basados en el mensaje del cliente.
  Si el cliente menciona un pedido específico, confirma los detalles y sugiere el siguiente paso.
  Si necesitas más información, haz preguntas específicas para entender mejor las necesidades del cliente.
  Si el cliente hace alguna pregunta que no esta relacionada con la ropa, responde de manera amigable una sutil respuesta muy breve y sugerile que si su pedido no esta relacionado con la ropa, que puede buscar en otro sitio web.`;
  }

  async processMessage(userMessage: string, clientId: string): Promise<string> {
    try {
      const session = this.getOrCreateSession(clientId);
      const products = await this.productRepository.find();
      const prompt = this.generatePrompt(products, userMessage);

      // Add user message to session history
      session.messages.push({
        role: 'user',
        content: userMessage
      });

      console.log('Sending request to Groq API with prompt:', prompt);

      const response = await this.openai.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Eres un agente de ventas B2B especializado en ropa. Responde de manera profesional y concisa en español."
          },
          ...session.messages.slice(-5), // Include last 5 messages for context
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
        top_p: 0.9,
        frequency_penalty: 0.5,
        presence_penalty: 0.5
      });

      console.log('Received response from Groq API:', response);

      if (!response || !response.choices[0]?.message?.content) {
        throw new Error('Empty response from model');
      }

      const aiResponse = response.choices[0].message.content.trim();

      // Add AI response to session history
      session.messages.push({
        role: 'assistant',
        content: aiResponse
      });

      // Update last updated timestamp
      session.lastUpdated = new Date();

      return aiResponse;
    } catch (error) {
      console.error('Error processing message:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.status,
        response: error.response?.data
      });

      if (error.message.includes('rate limit')) {
        return 'Lo siento, estamos procesando muchas solicitudes en este momento. Por favor, intenta de nuevo en unos minutos.';
      } else if (error.message.includes('API key')) {
        return 'Lo siento, hay un problema con la configuración del servicio. Por favor, contacta al administrador.';
      } else if (error.message.includes('model')) {
        return 'Lo siento, hay un problema con el modelo de IA. Por favor, contacta al administrador.';
      } else {
        return 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.';
      }
    }
  }
}