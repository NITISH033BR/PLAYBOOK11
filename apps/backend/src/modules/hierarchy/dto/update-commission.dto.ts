import { IsNumber, Min, Max } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class UpdateCommissionDto {
  @ApiProperty({ example: 5.0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate: number;
}
