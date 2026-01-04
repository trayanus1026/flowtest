import { IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ImportTransactionDto {
  @IsString()
  @IsOptional()
  externalId?: string;

  @IsDateString()
  postedAt: string;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

