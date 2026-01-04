import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class ExplainReconciliationResponse {
  @Field()
  explanation: string;

  @Field({ nullable: true })
  confidence?: string;
}

