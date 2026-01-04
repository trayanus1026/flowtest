import { InputType, Field, Float } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsDateString, IsNumber, IsUUID, Min } from 'class-validator';

@InputType()
export class FilterInvoiceInput {
  @Field({ nullable: true })
  @IsEnum(['open', 'matched', 'paid'])
  @IsOptional()
  status?: 'open' | 'matched' | 'paid';

  @Field(() => String, { nullable: true })
  @IsUUID()
  @IsOptional()
  vendorId?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxAmount?: number;
}

