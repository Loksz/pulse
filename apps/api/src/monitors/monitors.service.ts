import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Monitor, MonitorDocument, MonitorStatus } from './schemas/monitor.schema';
import { AssertionType } from './schemas/assertion.schema';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';

@Injectable()
export class MonitorsService {
  constructor(
    @InjectModel(Monitor.name)
    private readonly monitorModel: Model<MonitorDocument>,
  ) {}

  async create(userId: string, dto: CreateMonitorDto): Promise<MonitorDocument> {
    const assertions = dto.assertions?.length
      ? dto.assertions
      // - default assertion: expect HTTP 200
      : [{ type: AssertionType.STATUS_CODE, expected: 200 }];

    const monitor = await this.monitorModel.create({
      userId:      new Types.ObjectId(userId),
      name:        dto.name,
      url:         dto.url,
      method:      dto.method ?? 'GET',
      intervalSecs: dto.intervalSecs ?? 60,
      timeoutMs:   dto.timeoutMs ?? 10000,
      headers:     dto.headers ?? {},
      body:        dto.body ?? null,
      assertions,
      alert:       dto.alert ?? null,
      active:      true,
      status:      MonitorStatus.PENDING,
      nextCheckAt: new Date(),
    });

    return monitor;
  }

  async findAllByUser(userId: string): Promise<MonitorDocument[]> {
    return this.monitorModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean() as Promise<MonitorDocument[]>;
  }

  async findOne(userId: string, monitorId: string): Promise<MonitorDocument> {
    const monitor = await this.monitorModel.findById(monitorId).lean();
    if (!monitor) throw new NotFoundException('Monitor no encontrado');
    this.assertOwnership(monitor.userId, userId);
    return monitor as MonitorDocument;
  }

  async update(
    userId: string,
    monitorId: string,
    dto: UpdateMonitorDto,
  ): Promise<MonitorDocument> {
    const monitor = await this.monitorModel.findById(monitorId);
    if (!monitor) throw new NotFoundException('Monitor no encontrado');
    this.assertOwnership(monitor.userId, userId);

    Object.assign(monitor, dto);

    // - recalculate next check if interval changed
    if (dto.intervalSecs) {
      monitor.nextCheckAt = new Date(
        Date.now() + dto.intervalSecs * 1000,
      );
    }

    return monitor.save();
  }

  async toggleActive(userId: string, monitorId: string): Promise<MonitorDocument> {
    const monitor = await this.monitorModel.findById(monitorId);
    if (!monitor) throw new NotFoundException('Monitor no encontrado');
    this.assertOwnership(monitor.userId, userId);

    monitor.active = !monitor.active;

    // - resume: schedule immediately
    if (monitor.active) monitor.nextCheckAt = new Date();

    return monitor.save();
  }

  async remove(userId: string, monitorId: string): Promise<void> {
    const monitor = await this.monitorModel.findById(monitorId);
    if (!monitor) throw new NotFoundException('Monitor no encontrado');
    this.assertOwnership(monitor.userId, userId);
    await monitor.deleteOne();
    // - cascading cleanup of checks/notifications is handled by ChecksService
  }

  // - internal: used by CheckerProcessor to update status after a check
  async updateStatus(
    monitorId: string,
    status: MonitorStatus,
    intervalSecs: number,
  ): Promise<void> {
    await this.monitorModel.findByIdAndUpdate(monitorId, {
      status,
      lastCheckedAt: new Date(),
      nextCheckAt:   new Date(Date.now() + intervalSecs * 1000),
    });
  }

  private assertOwnership(ownerId: Types.ObjectId, requesterId: string): void {
    if (ownerId.toString() !== requesterId) {
      throw new ForbiddenException('No tienes acceso a este monitor');
    }
  }
}
