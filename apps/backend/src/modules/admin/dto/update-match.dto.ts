import { IsOptional, IsString, IsDateString, IsNumber } from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateMatchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leagueId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  homeTeamId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  awayTeamId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ enum: ["SCHEDULED", "LIVE", "FINISHED", "CANCELLED", "POSTPONED"] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  homeScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  awayScore?: number;
}
