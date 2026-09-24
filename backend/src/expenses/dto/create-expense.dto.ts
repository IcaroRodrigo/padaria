import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExpenseType, ExpenseStatus } from '@prisma/client';

export class CreateExpenseDto {
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @IsString()
  description: string;

  @IsNotEmpty({ message: 'Valor é obrigatório' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @IsNotEmpty({ message: 'Categoria é obrigatória' })
  @Type(() => Number)
  @IsNumber()
  categoryId: number;

  @IsEnum(ExpenseType, { message: 'Tipo inválido' })
  type: ExpenseType;

  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  recurrenceDay?: number;
}
