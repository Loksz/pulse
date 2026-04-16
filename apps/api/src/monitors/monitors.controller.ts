import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, Patch, Post, Put,
} from '@nestjs/common';
import { MonitorsService } from './monitors.service';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';

@Controller('monitors')
export class MonitorsController {
  constructor(private readonly monitorsService: MonitorsService) {}

  @Get()
  findAll(@CurrentUser() user: UserDocument) {
    return this.monitorsService.findAllByUser(user._id.toString());
  }

  @Post()
  create(@CurrentUser() user: UserDocument, @Body() dto: CreateMonitorDto) {
    return this.monitorsService.create(user._id.toString(), dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    return this.monitorsService.findOne(user._id.toString(), id);
  }

  @Put(':id')
  update(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Body() dto: UpdateMonitorDto,
  ) {
    return this.monitorsService.update(user._id.toString(), id, dto);
  }

  @Patch(':id/toggle')
  @HttpCode(HttpStatus.OK)
  toggle(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    return this.monitorsService.toggleActive(user._id.toString(), id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    return this.monitorsService.remove(user._id.toString(), id);
  }
}
