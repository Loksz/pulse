import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AssertionDocument = Assertion & Document;

export enum AssertionType {
  STATUS_CODE   = 'statusCode',
  RESPONSE_TIME = 'responseTime',
  BODY_CONTAINS = 'bodyContains',
  JSON_PATH     = 'jsonPath',
  SSL_EXPIRY    = 'sslExpiry',
}

@Schema({ _id: false, discriminatorKey: 'type' })
export class Assertion {
  @Prop({ required: true, enum: AssertionType })
  type: AssertionType;
}

export const AssertionSchema = SchemaFactory.createForClass(Assertion);

// - statusCode: expect exact code (e.g. 200)
@Schema({ _id: false })
export class StatusCodeAssertion extends Assertion {
  @Prop({ required: true })
  expected: number;
}
export const StatusCodeAssertionSchema = SchemaFactory.createForClass(StatusCodeAssertion);

// - responseTime: must be under maxMs
@Schema({ _id: false })
export class ResponseTimeAssertion extends Assertion {
  @Prop({ required: true })
  maxMs: number;
}
export const ResponseTimeAssertionSchema = SchemaFactory.createForClass(ResponseTimeAssertion);

// - bodyContains: response body must include string
@Schema({ _id: false })
export class BodyContainsAssertion extends Assertion {
  @Prop({ required: true })
  substring: string;
}
export const BodyContainsAssertionSchema = SchemaFactory.createForClass(BodyContainsAssertion);

// - jsonPath: evaluate jsonpath expression equals expected value
@Schema({ _id: false })
export class JsonPathAssertion extends Assertion {
  @Prop({ required: true })
  path: string;

  @Prop({ required: true })
  expected: string;
}
export const JsonPathAssertionSchema = SchemaFactory.createForClass(JsonPathAssertion);

// - sslExpiry: cert must not expire within minDays
@Schema({ _id: false })
export class SslExpiryAssertion extends Assertion {
  @Prop({ required: true, default: 14 })
  minDays: number;
}
export const SslExpiryAssertionSchema = SchemaFactory.createForClass(SslExpiryAssertion);
