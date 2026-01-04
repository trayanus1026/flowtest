import { InputType, Field, Float } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, IsUUID, Min } from 'class-validator';

@InputType()
export class CreateInvoiceInput {
  @Field(() => String, { nullable: true })
  @IsUUID()
  @IsOptional()
  vendorId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  amount: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  currency?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  invoiceDate?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @IsEnum(['open', 'matched', 'paid'])
  @IsOptional()
  status?: 'open' | 'matched' | 'paid';
}

