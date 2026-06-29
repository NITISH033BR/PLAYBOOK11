import { IsNumber, IsPositive, IsUUID, IsOptional, IsString, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AddBalanceDto {
  @ApiProperty({ example: "uuid-of-user" })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 1000.0 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
