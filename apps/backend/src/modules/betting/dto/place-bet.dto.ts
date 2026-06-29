import { IsNumber, IsPositive, IsEnum, IsArray, ArrayMinSize, ValidateNested, IsUUID } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class BetLegDto {
  @ApiProperty()
  @IsUUID()
  marketId: string;

  @ApiProperty()
  @IsUUID()
  oddsId: string;
}

export class PlaceBetDto {
  @ApiProperty({ example: 25.0 })
  @IsNumber()
  @IsPositive()
  stake: number;

  @ApiProperty({ enum: ["SINGLE", "MULTI"], example: "SINGLE" })
  @IsEnum(["SINGLE", "MULTI"])
  type: "SINGLE" | "MULTI";

  @ApiProperty({ type: [BetLegDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BetLegDto)
  legs: BetLegDto[];
}
