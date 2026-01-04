import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, IsUUID, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateInvoiceDto {
  @IsUUID()
  @IsOptional()
  vendorId?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsDateString()
  @IsOptional()
  invoiceDate?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['open', 'matched', 'paid'])
  @IsOptional()
  status?: 'open' | 'matched' | 'paid';
}

