import { IsOptional, IsEnum, IsDateString, IsNumber, IsUUID, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class FilterInvoiceDto {
  @IsEnum(['open', 'matched', 'paid'])
  @IsOptional()
  status?: 'open' | 'matched' | 'paid';

  @IsUUID()
  @IsOptional()
  vendorId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxAmount?: number;
}

