import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Product } from '../../../module_products/models/entity/product.entity';
import OpenAI from 'openai';
import { Order } from 'src/context/module_order/models/entity/order.entity';
import { AIServiceInterface } from './ai.service.interface';
import axios from 'axios';

interface ChatSession {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  lastUpdated: Date;
}

@Injectable()
export class AIService implements AIServiceInterface {
  private openai: OpenAI;
  private chatSessions: Map<string, ChatSession> = new Map();
  private readonly ordersApiUrl = 'https://api-wvuvaorzlq-uc.a.run.app';

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
  1) Dale una cálida bienvenida al cliente y preséntate como agente de ventas de Easy Stock, especializado en asesorar sobre productos de ropa. Tu objetivo es ayudarlo a encontrar exactamente lo que necesita.
  2) Responde de manera profesional, amable y concisa. Si el mensaje del cliente menciona un tipo de prenda, estilo o necesidad específica, sugiere productos relevantes acorde a esa información.
  3) Si el cliente hace referencia a un pedido concreto, confirma los detalles y sugiere el próximo paso (por ejemplo, confirmar tallas, disponibilidad o realizar el pago).
  4) Si no queda claro lo que necesita, formula preguntas específicas para entender mejor su solicitud (por ejemplo, "¿Está buscando ropa para hombre, mujer o niño?" o "¿Qué tipo de prenda necesita?").
  5) Si el cliente hace una pregunta que no está relacionada con productos de ropa, responde de forma amable con una breve aclaración y sugiérele que si su solicitud no está relacionada con ropa, puede buscar en otro sitio web.
  6) Mantén siempre un tono cordial, enfocado en ayudar y cerrar la venta  
  7) Si el cliente expresa intención de realizar un pedido, al final de tu respuesta incluye un bloque JSON en la siguiente forma:

    {
      "createOrder": true,
      "productCodes": ["CÓDIGO_PRODUCTO_1", "CÓDIGO_PRODUCTO_2"],
      "quantities": [CANTIDAD_1, CANTIDAD_2],
      "orderId": "Genera un Id unico y aleatorio para el pedido",
      "customerName": "Nombre del cliente",
      "customerPhone": "Teléfono del cliente",
      "dni": "El DNI del cliente"
    }

  `;
  }

  private async createOrderInMicroservice(orderData: any): Promise<void> {
    try {
      const orderPayload = {
        id: orderData.orderId,
        customerName: orderData.customerName || 'Cliente no especificado',
        customerPhone: orderData.customerPhone || 'No especificado',
        items: orderData.productCodes.map((code: string, index: number) => ({
          productId: code,
          quantity: orderData.quantities[index],
          price: 0 // Este valor se actualizará en el microservicio
        })),
        totalAmount: 0, // Este valor se calculará en el microservicio
        status: 'pending'
      };

      console.log('Sending order to microservice:', orderPayload);

      const response = await axios.post(`${this.ordersApiUrl}/orders`, orderPayload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('Order created successfully in microservice:', response.data);
    } catch (error) {
      console.error('Error creating order in microservice:', error.response?.data || error.message);
      throw error;
    }
  }

  async processMessage(userMessage: string, clientId: string): Promise<string> {
    try {
      const session = this.getOrCreateSession(clientId);
      const products = await this.productRepository.find();
      const prompt = this.generatePrompt(products, userMessage);

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
          ...session.messages.slice(-5),
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
      session.messages.push({
        role: 'assistant',
        content: aiResponse
      });

      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      let createdOrderMessage = '';

      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.createOrder) {
            await this.createOrderInMicroservice(parsed);
            createdOrderMessage = '\n🧾 La orden ha sido registrada exitosamente.';
          }
        } catch (e) {
          console.error('Error al parsear JSON de orden:', e);
        }
      }

      session.lastUpdated = new Date();

      return aiResponse + createdOrderMessage;
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