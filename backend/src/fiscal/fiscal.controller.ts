import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { FiscalService } from './fiscal.service';
import { EmitFiscalNoteDto, CancelFiscalNoteDto, InutilizarDto, EmitCaixaDto } from './dto/fiscal.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('fiscal')
@UseGuards(JwtAuthGuard)
export class FiscalController {
  constructor(private fiscalService: FiscalService) {}

  @Get()
  listar(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('status') status?: string,
  ) {
    return this.fiscalService.listar(user.empresaId, page ? Number(page) : 1, status);
  }

  @Post('emit/:saleId')
  emit(
    @CurrentUser() user: any,
    @Param('saleId', ParseIntPipe) saleId: number,
    @Body() body: EmitFiscalNoteDto,
  ) {
    return this.fiscalService.emitir(saleId, user.empresaId, body.cpf);
  }

  @Get('caixa/:cashRegisterId/check')
  checkCaixa(
    @CurrentUser() user: any,
    @Param('cashRegisterId', ParseIntPipe) cashRegisterId: number,
  ) {
    return this.fiscalService.checkCaixaElegivel(cashRegisterId, user.empresaId);
  }

  @Post('caixa/:cashRegisterId/emit')
  emitCaixa(
    @CurrentUser() user: any,
    @Param('cashRegisterId', ParseIntPipe) cashRegisterId: number,
    @Body() body: EmitCaixaDto,
  ) {
    return this.fiscalService.emitirCaixa(cashRegisterId, user.empresaId, body.cpf);
  }

  @Post('inutilizar')
  inutilizar(@CurrentUser() user: any, @Body() body: InutilizarDto) {
    return this.fiscalService.inutilizar(user.empresaId, body);
  }

  @Get('sale/:saleId')
  getBySale(@CurrentUser() user: any, @Param('saleId', ParseIntPipe) saleId: number) {
    return this.fiscalService.consultar(saleId, user.empresaId);
  }

  @Post(':id/send-xml')
  sendXml(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.fiscalService.enviarXml(id, user.empresaId);
  }

  @Delete(':id/cancel')
  cancel(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CancelFiscalNoteDto,
  ) {
    return this.fiscalService.cancelar(id, user.empresaId, body.justificativa);
  }
}
