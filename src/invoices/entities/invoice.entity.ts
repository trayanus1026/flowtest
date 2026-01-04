import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class Invoice {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  tenantId: string;

  @Field(() => ID, { nullable: true })
  vendorId?: string;

  @Field({ nullable: true })
  invoiceNumber?: string;

  @Field(() => Float)
  amount: string;

  @Field()
  currency: string;

  @Field({ nullable: true })
  invoiceDate?: Date;

  @Field({ nullable: true })
  description?: string;

  @Field()
  status: string;

  @Field()
  createdAt: Date;
}

