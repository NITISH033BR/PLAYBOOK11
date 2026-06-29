import { IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class HierarchyDepositDto {
  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: "Master deposit" })
  @IsOptional()
  @IsString()
  description?: string;
}

export class HierarchyWithdrawDto {
  @ApiProperty({ example: 50 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: "Agent withdrawal" })
  @IsOptional()
  @IsString()
  description?: string;
}
