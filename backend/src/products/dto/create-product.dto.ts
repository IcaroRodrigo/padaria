import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty({ message: 'Categoria é obrigatória' })
  @Type(() => Number)
  @IsNumber()
  categoryId: number;

  @IsNotEmpty({ message: 'Unidade é obrigatória' })
  @IsString()
  unit: string;

  @IsNotEmpty({ message: 'Preço de custo é obrigatório' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPrice: number;

  @IsNotEmpty({ message: 'Preço de venda é obrigatório' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salePrice: number;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  supplierId?: number;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockQty?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minStockQty?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  plu?: number;
}
