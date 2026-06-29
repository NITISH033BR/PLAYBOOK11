import { IsString, IsOptional, IsDateString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateMatchDto {
  @ApiProperty()
  @IsString()
  leagueId: string;

  @ApiProperty()
  @IsString()
  homeTeamId: string;

  @ApiProperty()
  @IsString()
  awayTeamId: string;

  @ApiProperty()
  @IsDateString()
  startTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
