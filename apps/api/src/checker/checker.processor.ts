import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { CheckerService } from './checker.service';
import { AssertionEvaluator } from './assertion-evaluator';
import { ChecksService } from '../checks/checks.service';
import { MonitorsService } from '../monitors/monitors.service';
import { MonitorStatus } from '../monitors/schemas/monitor.schema';
import { CheckStatus } from '../checks/schemas/check.schema';

export interface CheckJobData {
  monitorId:    string;
  intervalSecs: number;
}

@Processor('pulse-checks')
export class CheckerProcessor extends WorkerHost {
  private readonly logger = new Logger(CheckerProcessor.name);

  constructor(
    private readonly checkerService:    CheckerService,
    private readonly assertionEvaluator: AssertionEvaluator,
    private readonly checksService:     ChecksService,
    private readonly monitorsService:   MonitorsService,
  ) {
    super();
  }

  async process(job: Job<CheckJobData>): Promise<void> {
    const { monitorId, intervalSecs } = job.data;

    // - fetch full monitor document
    const monitor = await this.monitorsService.findById(monitorId);
    if (!monitor || !monitor.active) return;

    // - execute HTTP request
    const result = await this.checkerService.executeCheck(monitor);

    // - evaluate assertions
    const { passed, failures } = this.assertionEvaluator.evaluate(monitor, result);

    // - determine status
    let status: MonitorStatus;
    if (result.error) {
      status = MonitorStatus.DOWN;
    } else if (!passed) {
      status = failures.some(f => f.startsWith('statusCode') || f.startsWith('responseTime'))
        ? MonitorStatus.DOWN
        : MonitorStatus.DEGRADED;
    } else {
      status = MonitorStatus.UP;
    }

    const checkStatus = status === MonitorStatus.UP
      ? CheckStatus.UP
      : status === MonitorStatus.DEGRADED
        ? CheckStatus.DEGRADED
        : CheckStatus.DOWN;

    // - persist check result
    await this.checksService.save({
      monitorId,
      status:            checkStatus,
      statusCode:        result.statusCode,
      responseTimeMs:    result.responseTimeMs,
      assertionFailures: failures,
    });

    // - update monitor status + schedule next check
    await this.monitorsService.updateStatus(monitorId, status, intervalSecs);

    if (status !== MonitorStatus.UP) {
      this.logger.warn(
        `Monitor ${monitorId} → ${status} (${result.error ?? failures.join('; ')})`,
      );
    }
  }
}
