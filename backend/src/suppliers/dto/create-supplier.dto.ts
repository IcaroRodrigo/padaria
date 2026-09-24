import { IsNotEmpty, IsString, IsOptional, IsEmail, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSupplierDto {
  @IsNotEmpty({ message: 'Razão social é obrigatória' })
  @IsString()
  companyName: string;

  @IsOptional()
  @IsString()
  tradeName?: string;

  @IsOptional()
  @IsString()
  cnpj?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  deliveryDays?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
