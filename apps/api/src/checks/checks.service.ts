import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Check, CheckDocument, CheckStatus } from './schemas/check.schema';

export interface CreateCheckData {
  monitorId: string;
  status: CheckStatus;
  statusCode: number | null;
  responseTimeMs: number | null;
  assertionFailures: string[];
}

@Injectable()
export class ChecksService {
  constructor(
    @InjectModel(Check.name)
    private readonly checkModel: Model<CheckDocument>,
  ) {}

  async save(data: CreateCheckData): Promise<CheckDocument> {
    return this.checkModel.create({
      monitorId:         new Types.ObjectId(data.monitorId),
      status:            data.status,
      statusCode:        data.statusCode,
      responseTimeMs:    data.responseTimeMs,
      assertionFailures: data.assertionFailures,
      checkedAt:         new Date(),
    });
  }

  async findByMonitor(
    monitorId: string,
    opts: { cursor?: string; limit?: number } = {},
  ): Promise<{ checks: CheckDocument[]; nextCursor: string | null }> {
    const limit = Math.min(opts.limit ?? 100, 500);
    const filter: Record<string, unknown> = {
      monitorId: new Types.ObjectId(monitorId),
    };

    if (opts.cursor) {
      filter.checkedAt = { $lt: new Date(opts.cursor) };
    }

    const checks = await this.checkModel
      .find(filter)
      .sort({ checkedAt: -1 })
      .limit(limit + 1)
      .lean() as CheckDocument[];

    const hasMore = checks.length > limit;
    if (hasMore) checks.pop();

    const nextCursor = hasMore
      ? checks[checks.length - 1].checkedAt.toISOString()
      : null;

    return { checks, nextCursor };
  }
}
