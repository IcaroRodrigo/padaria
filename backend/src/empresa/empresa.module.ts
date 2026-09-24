import { Module } from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { AdminEmpresaController, EmpresaController } from './empresa.controller';

@Module({
  controllers: [AdminEmpresaController, EmpresaController],
  providers: [EmpresaService],
  exports: [EmpresaService],
})
export class EmpresaModule {}
