import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AssertionSchema, Assertion } from './assertion.schema';
import { AlertConfig, AlertConfigSchema } from './alert-config.schema';

export type MonitorDocument = HydratedDocument<Monitor>;

export enum HttpMethod {
  GET    = 'GET',
  POST   = 'POST',
  PUT    = 'PUT',
  PATCH  = 'PATCH',
  DELETE = 'DELETE',
  HEAD   = 'HEAD',
}

export enum MonitorStatus {
  PENDING  = 'PENDING',
  UP       = 'UP',
  DOWN     = 'DOWN',
  DEGRADED = 'DEGRADED',
}

@Schema({ timestamps: true })
export class Monitor {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({ required: true, trim: true })
  url: string;

  @Prop({ required: true, enum: HttpMethod, default: HttpMethod.GET })
  method: HttpMethod;

  // - interval between checks in seconds (min 30, max 86400)
  @Prop({ required: true, default: 60 })
  intervalSecs: number;

  @Prop({ default: 10000 })
  timeoutMs: number;

  // - optional headers sent with each request
  @Prop({ type: Map, of: String, default: {} })
  headers: Map<string, string>;

  // - optional request body (for POST/PUT/PATCH)
  @Prop({ default: null })
  body: string | null;

  @Prop({ type: [AssertionSchema], default: [] })
  assertions: Assertion[];

  @Prop({ type: AlertConfigSchema, default: null })
  alert: AlertConfig | null;

  @Prop({ default: true })
  active: boolean;

  @Prop({ required: true, enum: MonitorStatus, default: MonitorStatus.PENDING })
  status: MonitorStatus;

  // - used by scheduler to find due monitors efficiently
  @Prop({ type: Date, default: () => new Date() })
  nextCheckAt: Date;

  @Prop({ type: Date, default: null })
  lastCheckedAt: Date | null;
}

export const MonitorSchema = SchemaFactory.createForClass(Monitor);

// - scheduler index: find active monitors that are due
MonitorSchema.index({ userId: 1, active: 1 });
MonitorSchema.index({ nextCheckAt: 1 });
