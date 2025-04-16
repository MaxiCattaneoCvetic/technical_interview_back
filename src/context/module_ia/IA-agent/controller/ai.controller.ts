import { Controller, Post, Body, HttpException, HttpStatus, Inject } from '@nestjs/common';

import { AIServiceInterface } from '../service/ai.service.interface';

@Controller('ai')
export class AIController {
  constructor(
    @Inject("AIServiceInterface")
    private readonly aiService: AIServiceInterface
  ) { }

  @Post('process-message')
  async processMessage(@Body() body: { message: string, id: string }) {
    try {
      if (!body.message) {
        throw new HttpException('Message is required', HttpStatus.BAD_REQUEST);
      }
      const response = await this.aiService.processMessage(body.message, body.id);
      return response;
    } catch (error) {
      console.error('Error in processMessage:', error);
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 