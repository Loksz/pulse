import { Injectable } from '@nestjs/common';
import axios from 'axios';
import type { MonitorDocument } from '../monitors/schemas/monitor.schema';

export interface HttpCheckResult {
  statusCode: number | null;
  responseTimeMs: number;
  body: string;
  headers: Record<string, string>;
  error: string | null;
}

@Injectable()
export class CheckerService {
  async executeCheck(monitor: MonitorDocument): Promise<HttpCheckResult> {
    const start = Date.now();

    try {
      const response = await axios.request({
        method:  monitor.method,
        url:     monitor.url,
        headers: Object.fromEntries(monitor.headers as Map<string, string>),
        data:    monitor.body ?? undefined,
        timeout: monitor.timeoutMs,
        // - don't throw on non-2xx so we can capture the status
        validateStatus: () => true,
        // - limit body size for safety
        maxContentLength: 512 * 1024,
        responseType: 'text',
      });

      return {
        statusCode:    response.status,
        responseTimeMs: Date.now() - start,
        body:          String(response.data),
        headers:       response.headers as Record<string, string>,
        error:         null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return {
        statusCode:    null,
        responseTimeMs: Date.now() - start,
        body:          '',
        headers:       {},
        error:         message,
      };
    }
  }
}
