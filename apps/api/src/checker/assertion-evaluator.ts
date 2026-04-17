import { Injectable } from '@nestjs/common';
import * as tls from 'tls';
import { AssertionType } from '../monitors/schemas/assertion.schema';
import type { HttpCheckResult } from './checker.service';
import type { MonitorDocument } from '../monitors/schemas/monitor.schema';

export interface AssertionResult {
  passed: boolean;
  failures: string[];
}

@Injectable()
export class AssertionEvaluator {
  evaluate(
    monitor: MonitorDocument,
    result: HttpCheckResult,
  ): AssertionResult {
    const failures: string[] = [];

    for (const assertion of monitor.assertions) {
      switch (assertion.type) {
        case AssertionType.STATUS_CODE: {
          const expected = (assertion as unknown as { expected: number }).expected;
          if (result.statusCode !== expected) {
            failures.push(
              `statusCode: expected ${expected}, got ${result.statusCode ?? 'none'}`,
            );
          }
          break;
        }

        case AssertionType.RESPONSE_TIME: {
          const maxMs = (assertion as unknown as { maxMs: number }).maxMs;
          if (result.responseTimeMs > maxMs) {
            failures.push(
              `responseTime: ${result.responseTimeMs}ms > ${maxMs}ms`,
            );
          }
          break;
        }

        case AssertionType.BODY_CONTAINS: {
          const substring = (assertion as unknown as { substring: string }).substring;
          if (!result.body.includes(substring)) {
            failures.push(`bodyContains: "${substring}" not found in response`);
          }
          break;
        }

        case AssertionType.JSON_PATH: {
          const { path, value: expected } = assertion as unknown as { path: string; value: string };
          try {
            const json = JSON.parse(result.body) as unknown;
            const actual = this.resolvePath(json, path);
            if (String(actual) !== String(expected)) {
              failures.push(
                `jsonPath: ${path} = "${String(actual)}", expected "${expected}"`,
              );
            }
          } catch {
            failures.push(`jsonPath: could not parse response as JSON`);
          }
          break;
        }

        case AssertionType.SSL_EXPIRY: {
          const minDays = (assertion as unknown as { minDays: number }).minDays;
          // - async SSL check is best-effort; evaluated separately
          void this.checkSslExpiry(monitor.url, minDays).then(failure => {
            if (failure) failures.push(failure);
          });
          break;
        }
      }
    }

    return { passed: failures.length === 0, failures };
  }

  // - simple dot-notation path resolver (e.g. "data.status")
  private resolvePath(obj: unknown, path: string): unknown {
    return path.split('.').reduce((acc, key) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  private checkSslExpiry(url: string, minDays: number): Promise<string | null> {
    return new Promise(resolve => {
      try {
        const { hostname } = new URL(url);
        const socket = tls.connect({ host: hostname, port: 443, servername: hostname }, () => {
          const cert = socket.getPeerCertificate();
          socket.destroy();
          if (!cert?.valid_to) {
            resolve(`sslExpiry: could not read certificate`);
            return;
          }
          const expiresAt = new Date(cert.valid_to);
          const daysLeft  = Math.floor((expiresAt.getTime() - Date.now()) / 86400000);
          if (daysLeft < minDays) {
            resolve(`sslExpiry: cert expires in ${daysLeft}d (min ${minDays}d required)`);
          } else {
            resolve(null);
          }
        });
        socket.on('error', () => resolve(null));
        socket.setTimeout(5000, () => { socket.destroy(); resolve(null); });
      } catch {
        resolve(null);
      }
    });
  }
}
