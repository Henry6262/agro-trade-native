import { Controller, Get } from '@nestjs/common';
import { DealsService } from './deals.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Deals')
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  findAll() {
    return this.dealsService.findAll();
  }
}