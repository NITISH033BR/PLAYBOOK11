import { IsString, IsNumber, IsPositive, IsIn } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PlaceLiveBetDto {
  @ApiProperty({ example: "e6f0b5c0-5a5a-4a5a-9a5a-5a5a5a5a5a5a" })
  @IsString()
  eventId: string;

  @ApiProperty({ example: "h2h" })
  @IsString()
  @IsIn(["h2h", "spreads", "totals"])
  marketKey: string;

  @ApiProperty({ example: "Kansas City Chiefs" })
  @IsString()
  outcomeName: string;

  @ApiProperty({ example: 1.95 })
  @IsNumber()
  @IsPositive()
  odds: number;

  @ApiProperty({ example: 25.0 })
  @IsNumber()
  @IsPositive()
  stake: number;
}
