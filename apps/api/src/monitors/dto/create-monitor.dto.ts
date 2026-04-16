import {
  IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl,
  Max, Min, ValidateNested, IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HttpMethod } from '../schemas/monitor.schema';
import { AssertionType } from '../schemas/assertion.schema';
import { AlertChannel } from '../schemas/alert-config.schema';

// - base assertion DTO
export class AssertionDto {
  @IsEnum(AssertionType)
  type: AssertionType;

  // statusCode
  @IsOptional() @IsInt()
  expected?: number;

  // responseTime
  @IsOptional() @IsInt() @Min(1)
  maxMs?: number;

  // bodyContains
  @IsOptional() @IsString()
  substring?: string;

  // jsonPath
  @IsOptional() @IsString()
  path?: string;

  // sslExpiry
  @IsOptional() @IsInt() @Min(1)
  minDays?: number;
}

export class AlertConfigDto {
  @IsEnum(AlertChannel)
  channel: AlertChannel;

  @IsString() @IsNotEmpty()
  target: string;

  @IsOptional() @IsInt() @Min(1)
  failThreshold?: number;

  @IsOptional() @IsInt() @Min(1)
  cooldownMinutes?: number;
}

export class CreateMonitorDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsUrl({ require_tld: false })
  url: string;

  @IsOptional() @IsEnum(HttpMethod)
  method?: HttpMethod;

  @IsOptional() @IsInt() @Min(30) @Max(86400)
  intervalSecs?: number;

  @IsOptional() @IsInt() @Min(1000) @Max(30000)
  timeoutMs?: number;

  @IsOptional()
  headers?: Record<string, string>;

  @IsOptional() @IsString()
  body?: string;

  @IsOptional() @IsArray() @ValidateNested({ each: true })
  @Type(() => AssertionDto)
  assertions?: AssertionDto[];

  @IsOptional() @ValidateNested()
  @Type(() => AlertConfigDto)
  alert?: AlertConfigDto;
}
