import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      status: 'ok',
      service: 'Mini Kanban Backend API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
