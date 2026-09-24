import {
  IsNotEmpty,
  IsNumber,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
  IsString,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SaleItemDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  productId: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount?: number;
}

export class SalePaymentDto {
  @IsNotEmpty()
  @IsString()
  method: string; // CASH, PIX, DEBIT, CREDIT

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateSaleDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  customerId?: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  cashRegisterId: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalePaymentDto)
  payments: SalePaymentDto[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountPaid?: number;
}

export class OpenCashRegisterDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  openingBalance: number;
}

export class CloseCashRegisterDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  closingBalance: number;
}

export class CancelSaleDto {
  @IsNotEmpty({ message: 'Motivo de cancelamento é obrigatório' })
  @IsString()
  reason: string;
}

export class CorrectSaleItemDto {
  @IsInt()
  saleItemId: number;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;
}
