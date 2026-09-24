import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import {
  CreateSaleDto,
  OpenCashRegisterDto,
  CloseCashRegisterDto,
  CancelSaleDto,
  CorrectSaleItemDto,
} from './dto/create-sale.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private salesService: SalesService) {}

  // Cash Register
  @Post('cash-register/open')
  openCashRegister(@CurrentUser() user: any, @Body() dto: OpenCashRegisterDto) {
    return this.salesService.openCashRegister(user.id, user.empresaId, dto);
  }

  @Post('cash-register/:id/close')
  closeCashRegister(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CloseCashRegisterDto,
  ) {
    return this.salesService.closeCashRegister(user.id, user.empresaId, id, dto);
  }

  @Get('cash-register/current')
  getOpenCashRegister(@CurrentUser() user: any) {
    return this.salesService.getOpenCashRegister(user.id, user.empresaId);
  }

  @Get('cash-register/history')
  getCashRegisterHistory(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.salesService.getCashRegisterHistory(user.empresaId, startDate, endDate);
  }

  @Get('cash-register/:id/products')
  getCashRegisterProducts(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.salesService.getCashRegisterProducts(user.empresaId, id);
  }

  // Sales
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateSaleDto) {
    return this.salesService.create(user.id, user.empresaId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('userId') userId?: number,
    @Query('cashRegisterId') cashRegisterId?: number,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.salesService.findAll(user.empresaId, {
      startDate,
      endDate,
      paymentMethod,
      userId,
      cashRegisterId,
      status,
      page,
      limit,
    });
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(user.empresaId, id);
  }

  @Patch(':id/cancel')
  cancel(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelSaleDto,
  ) {
    return this.salesService.cancel(user.empresaId, id, dto);
  }

  @Patch(':id/correct-item')
  correctItem(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CorrectSaleItemDto,
  ) {
    return this.salesService.correctItem(user.empresaId, id, dto);
  }
}
