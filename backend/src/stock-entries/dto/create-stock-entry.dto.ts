import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStockEntryDto {
  @IsInt()
  @Type(() => Number)
  productId: number;

  @IsNumber()
  @Min(0.001, { message: 'Quantidade deve ser maior que zero' })
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @Min(0, { message: 'Custo unitário não pode ser negativo' })
  @Type(() => Number)
  unitCost: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  supplierId?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
