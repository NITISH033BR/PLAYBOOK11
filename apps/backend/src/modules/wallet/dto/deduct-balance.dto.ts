import { IsNumber, IsPositive, IsUUID, IsOptional, IsString, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class DeductBalanceDto {
  @ApiProperty({ example: "uuid-of-user" })
  @IsUUID()
  userId: string;

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
