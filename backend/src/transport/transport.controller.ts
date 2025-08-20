import { Controller, Get } from '@nestjs/common';
import { TransportService } from './transport.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Transport')
@Controller('transport')
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Get('jobs')
  findAllJobs() {
    return this.transportService.findAllJobs();
  }
}