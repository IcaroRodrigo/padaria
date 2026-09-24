import { IsOptional, IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class EmitFiscalNoteDto {
  @IsOptional()
  @IsString()
  cpf?: string;
}

export class CancelFiscalNoteDto {
  @IsNotEmpty({ message: 'Justificativa é obrigatória' })
  @IsString()
  justificativa: string;
}

export class EmitCaixaDto {
  @IsOptional()
  @IsString()
  cpf?: string;
}

export class InutilizarDto {
  @IsInt()
  @Min(1)
  numeroInicial: number;

  @IsInt()
  @Min(1)
  numeroFinal: number;

  @IsOptional()
  @IsString()
  serie?: string;

  @IsNotEmpty({ message: 'Justificativa é obrigatória' })
  @IsString()
  justificativa: string;
}
