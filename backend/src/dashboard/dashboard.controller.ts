import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('overview')
  getOverview(@CurrentUser() user: any) {
    return this.dashboardService.getOverview(user.empresaId);
  }

  @Get('revenue')
  getRevenue(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('groupBy') groupBy: 'day' | 'month' = 'day',
  ) {
    return this.dashboardService.getRevenueByPeriod(user.empresaId, startDate, endDate, groupBy);
  }

  @Get('payment-methods')
  getPaymentMethods(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.dashboardService.getRevenueByPaymentMethod(user.empresaId, startDate, endDate);
  }

  @Get('top-products')
  getTopProducts(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit?: number,
  ) {
    return this.dashboardService.getTopProducts(user.empresaId, startDate, endDate, limit);
  }

  @Get('cash-flow')
  getCashFlow(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.dashboardService.getCashFlow(user.empresaId, startDate, endDate);
  }

  @Get('profit')
  getProfit(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('groupBy') groupBy: 'day' | 'month' = 'month',
  ) {
    return this.dashboardService.getProfitByPeriod(user.empresaId, startDate, endDate, groupBy);
  }
}
