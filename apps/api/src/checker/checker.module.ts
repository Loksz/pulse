import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Monitor, MonitorSchema } from '../monitors/schemas/monitor.schema';
import { MonitorsModule } from '../monitors/monitors.module';
import { ChecksModule } from '../checks/checks.module';
import { CheckerService } from './checker.service';
import { AssertionEvaluator } from './assertion-evaluator';
import { CheckerScheduler } from './checker.scheduler';
import { CheckerProcessor } from './checker.processor';
import type { Env } from '../config/env';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env>) => ({
        connection: {
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
        },
      }),
    }),
    BullModule.registerQueue({ name: 'pulse-checks' }),
    // - scheduler needs direct model access to query due monitors efficiently
    MongooseModule.forFeature([{ name: Monitor.name, schema: MonitorSchema }]),
    MonitorsModule,
    ChecksModule,
  ],
  providers: [
    CheckerService,
    AssertionEvaluator,
    CheckerScheduler,
    CheckerProcessor,
  ],
})
export class CheckerModule {}
