import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MonitorsModule } from './monitors/monitors.module';
import { CheckerModule } from './checker/checker.module';
import { ChecksModule } from './checks/checks.module';
import { AlertsModule } from './alerts/alerts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StatsModule } from './stats/stats.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  controllers: [AppController],
  providers: [
    AppService,
    // apply JWT guard to all routes by default
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    MonitorsModule,
    CheckerModule,
    ChecksModule,
    AlertsModule,
    NotificationsModule,
    StatsModule,
    GatewayModule,
  ],
})
export class AppModule {}
