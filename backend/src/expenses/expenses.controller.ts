import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(user.empresaId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: number,
  ) {
    return this.expensesService.findAll(user.empresaId, {
      startDate,
      endDate,
      type,
      status,
      categoryId,
    });
  }

  @Post('generate-recurring')
  generateRecurring() {
    return this.expensesService.generateRecurringExpenses().then((count) => ({ generated: count }));
  }

  @Get('categories')
  getCategories(@CurrentUser() user: any) {
    return this.expensesService.getCategories(user.empresaId);
  }

  @Post('categories')
  createCategory(@CurrentUser() user: any, @Body('name') name: string) {
    return this.expensesService.createCategory(user.empresaId, name);
  }

  @Delete('categories/:id')
  deleteCategory(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.expensesService.deleteCategory(user.empresaId, id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.expensesService.findOne(user.empresaId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateExpenseDto>,
  ) {
    return this.expensesService.update(user.empresaId, id, dto);
  }

  @Patch(':id/pay')
  markAsPaid(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.expensesService.markAsPaid(user.empresaId, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.expensesService.remove(user.empresaId, id);
  }
}
