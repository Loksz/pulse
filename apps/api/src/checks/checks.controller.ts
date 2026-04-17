import { Controller, Get, Param, Query } from '@nestjs/common';
import { ChecksService } from './checks.service';
import { MonitorsService } from '../monitors/monitors.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';

@Controller('monitors/:monitorId/checks')
export class ChecksController {
  constructor(
    private readonly checksService: ChecksService,
    private readonly monitorsService: MonitorsService,
  ) {}

  @Get()
  async findByMonitor(
    @CurrentUser() user: UserDocument,
    @Param('monitorId') monitorId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    // - verify monitor ownership before returning checks
    await this.monitorsService.findOne(user._id.toString(), monitorId);
    return this.checksService.findByMonitor(monitorId, {
      cursor,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
