import { Controller, Get, Res, UseGuards, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('downloads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class DownloadsController {
  @Get('agent-impressora')
  downloadAgent(@Res() res: Response) {
    const filePath = join(process.cwd(), 'static', 'agent_impressora.exe');

    if (!existsSync(filePath)) {
      throw new NotFoundException('Arquivo agent_impressora.exe não encontrado no servidor');
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="agent_impressora.exe"');
    createReadStream(filePath).pipe(res);
  }
}
