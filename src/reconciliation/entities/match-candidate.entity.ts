import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class MatchCandidate {
  @Field(() => ID)
  invoiceId: string;

  @Field(() => ID)
  bankTransactionId: string;

  @Field(() => Float)
  score: number;

  @Field({ nullable: true })
  explanation?: string;
}

