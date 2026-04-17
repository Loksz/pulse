import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum AssertionType {
  STATUS_CODE   = 'statusCode',
  RESPONSE_TIME = 'responseTime',
  BODY_CONTAINS = 'bodyContains',
  JSON_PATH     = 'jsonPath',
  SSL_EXPIRY    = 'sslExpiry',
}

// - flat schema: all subtype fields coexist, only relevant ones are set per type
@Schema({ _id: false })
export class Assertion {
  @Prop({ required: true, enum: AssertionType })
  type: AssertionType;

  // statusCode — expected HTTP status code
  @Prop({ type: Number })
  expected?: number;

  // responseTime — max allowed milliseconds
  @Prop({ type: Number })
  maxMs?: number;

  // bodyContains — substring that must appear in response body
  @Prop({ type: String })
  substring?: string;

  // jsonPath — dot-notation path and expected string value
  @Prop({ type: String })
  path?: string;

  @Prop({ type: String })
  value?: string;

  // sslExpiry — minimum days before certificate expiry
  @Prop({ type: Number, default: 14 })
  minDays?: number;
}

export const AssertionSchema = SchemaFactory.createForClass(Assertion);
