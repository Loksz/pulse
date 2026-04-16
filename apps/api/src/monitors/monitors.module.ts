import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MonitorsController } from './monitors.controller';
import { MonitorsService } from './monitors.service';
import { Monitor, MonitorSchema } from './schemas/monitor.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Monitor.name, schema: MonitorSchema }]),
  ],
  controllers: [MonitorsController],
  providers: [MonitorsService],
  exports: [MonitorsService],
})
export class MonitorsModule {}
