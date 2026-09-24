import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  getAll(@CurrentUser() user: any) {
    return this.settingsService.getAll(user.empresaId);
  }

  @Put()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  setMany(@CurrentUser() user: any, @Body() data: Record<string, string>) {
    return this.settingsService.setMany(data, user.empresaId);
  }
}
