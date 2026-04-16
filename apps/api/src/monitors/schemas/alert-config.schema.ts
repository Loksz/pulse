import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum AlertChannel {
  EMAIL   = 'EMAIL',
  WEBHOOK = 'WEBHOOK',
}

@Schema({ _id: false })
export class AlertConfig {
  @Prop({ required: true, enum: AlertChannel })
  channel: AlertChannel;

  // - email or webhook url depending on channel
  @Prop({ required: true })
  target: string;

  // - how many consecutive failures before alerting
  @Prop({ default: 1 })
  failThreshold: number;

  // - minimum minutes between repeated alerts
  @Prop({ default: 60 })
  cooldownMinutes: number;

  // -- operational state (managed by checker, not user)
  @Prop({ default: 0 })
  consecutiveFails: number;

  @Prop({ type: Date, default: null })
  lastNotifiedAt: Date | null;
}

export const AlertConfigSchema = SchemaFactory.createForClass(AlertConfig);
