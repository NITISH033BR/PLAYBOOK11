import { IsString, IsEnum, IsArray, ValidateNested, IsNumber } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

class OddsInput {
  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty()
  @IsNumber()
  value: number;
}

export class CreateMarketDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ["MATCH_ODDS", "WIN_DRAW_WIN", "OVER_UNDER", "BOTH_TEAMS_SCORE", "HANDICAP", "CORRECT_SCORE", "BOOKMAKER", "SESSION", "FANCY", "PLAYER_RUNS", "TOP_BATSMAN", "TOP_BOWLER", "FIRST_INNINGS", "DRAW_NO_BET", "DOUBLE_CHANCE", "BTTW", "ODD_EVEN"] })
  @IsEnum(["MATCH_ODDS", "WIN_DRAW_WIN", "OVER_UNDER", "BOTH_TEAMS_SCORE", "HANDICAP", "CORRECT_SCORE", "BOOKMAKER", "SESSION", "FANCY", "PLAYER_RUNS", "TOP_BATSMAN", "TOP_BOWLER", "FIRST_INNINGS", "DRAW_NO_BET", "DOUBLE_CHANCE", "BTTW", "ODD_EVEN"])
  type: string;

  @ApiProperty({ type: [OddsInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OddsInput)
  odds: OddsInput[];
}
