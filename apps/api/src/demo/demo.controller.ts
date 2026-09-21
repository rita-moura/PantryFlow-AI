import { Body, Controller, Get, Ip, Post } from '@nestjs/common';
import { IsString, MaxLength } from 'class-validator';
import { DemoService } from './demo.service';
import type { DemoPlanResponse } from './demo.types';

class DemoPlanRequest {
  @IsString()
  @MaxLength(240)
  goal!: string;
}

@Controller('demo')
export class DemoController {
  constructor(private readonly service: DemoService) {}

  @Get()
  getCatalog() {
    return this.service.getCatalog();
  }

  @Post('plan')
  createPlan(
    @Body() body: DemoPlanRequest,
    @Ip() clientIp: string,
  ): DemoPlanResponse {
    return this.service.createPlan(body.goal, clientIp || 'unknown');
  }
}
