import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { StockEntriesService } from './stock-entries.service';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('stock-entries')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class StockEntriesController {
  constructor(private stockEntriesService: StockEntriesService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateStockEntryDto) {
    return this.stockEntriesService.create(user.empresaId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('productId') productId?: number,
    @Query('supplierId') supplierId?: number,
  ) {
    return this.stockEntriesService.findAll(user.empresaId, {
      startDate,
      endDate,
      productId,
      supplierId,
    });
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.stockEntriesService.remove(user.empresaId, id);
  }
}
