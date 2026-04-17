import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CheckDocument = HydratedDocument<Check>;

export enum CheckStatus {
  UP       = 'UP',
  DOWN     = 'DOWN',
  DEGRADED = 'DEGRADED',
}

@Schema({ timestamps: false })
export class Check {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Monitor', index: true })
  monitorId: Types.ObjectId;

  @Prop({ required: true, enum: CheckStatus })
  status: CheckStatus;

  @Prop({ type: Number, default: null })
  statusCode: number | null;

  @Prop({ type: Number, default: null })
  responseTimeMs: number | null;

  // - list of assertion failure descriptions (empty = all passed)
  @Prop({ type: [String], default: [] })
  assertionFailures: string[];

  @Prop({ required: true, type: Date, default: () => new Date() })
  checkedAt: Date;
}

export const CheckSchema = SchemaFactory.createForClass(Check);

// - efficient pagination by monitor + time
CheckSchema.index({ monitorId: 1, checkedAt: -1 });

// - TTL: auto-delete after CHECK_RETENTION_DAYS
const RETENTION_DAYS = Number(process.env.CHECK_RETENTION_DAYS ?? 90);
CheckSchema.index(
  { checkedAt: 1 },
  { expireAfterSeconds: RETENTION_DAYS * 86400 },
);
