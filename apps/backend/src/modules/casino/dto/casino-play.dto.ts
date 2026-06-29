import { IsString, IsNumber, IsOptional, Min, IsObject } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CasinoPlayDto {
  @ApiProperty()
  @IsString()
  gameSlug: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  betAmount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  betData?: Record<string, any>;
}

export class CasinoHitDto {
  @ApiProperty()
  @IsString()
  sessionId: string;
}

export class CasinoStandDto {
  @ApiProperty()
  @IsString()
  sessionId: string;
}

export class CasinoDoubleDto {
  @ApiProperty()
  @IsString()
  sessionId: string;
}
