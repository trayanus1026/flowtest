import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class BankTransaction {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  tenantId: string;

  @Field({ nullable: true })
  externalId?: string;

  @Field()
  postedAt: Date;

  @Field(() => Float)
  amount: string;

  @Field()
  currency: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  createdAt: Date;
}

