import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Check, CheckSchema } from './schemas/check.schema';
import { ChecksService } from './checks.service';
import { ChecksController } from './checks.controller';
import { MonitorsModule } from '../monitors/monitors.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Check.name, schema: CheckSchema }]),
    MonitorsModule,
  ],
  controllers: [ChecksController],
  providers: [ChecksService],
  exports: [ChecksService],
})
export class ChecksModule {}
