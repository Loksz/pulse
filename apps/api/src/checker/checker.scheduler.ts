import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Monitor, MonitorDocument } from '../monitors/schemas/monitor.schema';
import type { CheckJobData } from './checker.processor';

@Injectable()
export class CheckerScheduler {
  private readonly logger = new Logger(CheckerScheduler.name);

  constructor(
    @InjectQueue('pulse-checks')
    private readonly queue: Queue<CheckJobData>,
    @InjectModel(Monitor.name)
    private readonly monitorModel: Model<MonitorDocument>,
  ) {}

  // - runs every 10 seconds, enqueues due monitors
  @Cron('*/10 * * * * *')
  async dispatchDueChecks(): Promise<void> {
    const now = new Date();

    const due = await this.monitorModel
      .find({ active: true, nextCheckAt: { $lte: now } })
      .select('_id intervalSecs')
      .lean();

    if (!due.length) return;

    const jobs = due.map(m => ({
      name: 'check' as const,
      data: {
        monitorId:    (m._id as { toString(): string }).toString(),
        intervalSecs: m.intervalSecs,
      },
    }));

    await this.queue.addBulk(jobs);
    this.logger.debug(`Enqueued ${jobs.length} check(s)`);
  }
}
