import { IsNumber, IsPositive, IsUUID, IsOptional, IsString, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class TransferDto {
  @ApiProperty({ example: "uuid-of-recipient" })
  @IsUUID()
  toUserId: string;

  @ApiProperty({ example: 500.0 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
