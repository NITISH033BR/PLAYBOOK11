import { IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class HierarchyResetPasswordDto {
  @ApiProperty({ example: "NewSecurePass123!" })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
